import path from 'path';
import { IConfig } from '../common/data/types/config';
import { LanguageCode } from '../common/data/types/lang';
import { flattenObject, getValueByPath, setValue } from '../common/helper/add';
import { writeFile } from '../common/helper/file';
import { logger, loggerError, loggerWarning } from '../common/helper/logger';
import { getTranslate } from '../common/helper/translate';

export async function startSyncApp(configJson: IConfig): Promise<void> {
  const isDryRun = process.argv.includes('--dry-run');
  const specifiedTarget = process.argv?.[3]?.startsWith('--') ? undefined : process.argv?.[3];

  // 1. Identify primary/default locale
  const defaultLocaleCode = configJson.defaultLocale || configJson.locales[0]?.lang;
  const defaultLocaleEntry = configJson.locales.find((d) => d.lang.toLowerCase() === defaultLocaleCode.toLowerCase());

  if (!defaultLocaleEntry) {
    loggerError(`Default locale "${defaultLocaleCode}" is not defined in configuration locales.`);
    process.exit(1);
  }

  const defaultFilePath = path.resolve(process.cwd(), configJson.localePath, defaultLocaleEntry.file);

  let defaultData: Record<string, any> = {};
  try {
    defaultData = (await import(defaultFilePath))?.default || {};
  } catch (e: any) {
    loggerError(`Failed to load default locale from "${defaultFilePath}": ${e?.message}`);
    process.exit(1);
  }

  const defaultFlatItems = flattenObject(defaultData);
  if (defaultFlatItems.length === 0) {
    loggerWarning(`Default locale "${defaultLocaleEntry.file}" has no translation keys to sync.`);
    return;
  }

  // 2. Determine target locales to synchronize
  let targets = configJson.locales.filter(
    (d) => d.lang.toLowerCase() !== defaultLocaleCode.toLowerCase()
  );

  if (specifiedTarget) {
    const matched = targets.find((d) => d.lang.toLowerCase() === specifiedTarget.toLowerCase());
    if (!matched) {
      loggerError(`Target locale "${specifiedTarget}" is not configured or is the default locale.`);
      process.exit(1);
    }
    targets = [matched];
  }

  if (targets.length === 0) {
    loggerWarning('No secondary target locales found to sync.');
    return;
  }

  logger(`Starting sync using primary locale "${defaultLocaleCode}" (${defaultFlatItems.length} total keys)...`);
  if (isDryRun) {
    logger('🔍 DRY-RUN MODE: No files will be modified on disk.');
  }

  let totalKeysAdded = 0;

  // 3. Compare and sync each target locale
  for (const targetLocale of targets) {
    const targetFilePath = path.resolve(process.cwd(), configJson.localePath, targetLocale.file);
    let targetData: Record<string, any> = {};

    try {
      targetData = (await import(targetFilePath))?.default || {};
    } catch {
      targetData = {};
    }

    // Identify missing keys
    const missingItems = defaultFlatItems.filter((item) => {
      const existingVal = getValueByPath(targetData, item.path);
      return existingVal === undefined || existingVal === null || (typeof existingVal === 'string' && existingVal.trim() === '');
    });

    if (missingItems.length === 0) {
      logger(`Locale "${targetLocale.lang}" is completely up to date ✅`);
      continue;
    }

    logger(`Locale "${targetLocale.lang}" has ${missingItems.length} missing key(s).`);

    if (isDryRun) {
      for (const item of missingItems) {
        console.log(`  + [missing] ${item.path.join('.')} = "${item.value}"`);
      }
      totalKeysAdded += missingItems.length;
      continue;
    }

    // Translate each missing item
    logger(`Translating ${missingItems.length} missing key(s) into "${targetLocale.lang}"...`);
    for (const item of missingItems) {
      try {
        const translated = await getTranslate({
          text: item.value,
          from: defaultLocaleCode as LanguageCode,
          to: targetLocale.lang,
        });

        setValue(targetData, item.path, translated ?? item.value);
      } catch (e: any) {
        loggerWarning(`Failed to translate "${item.path.join('.')}" into "${targetLocale.lang}": ${e?.message}`);
        // Fallback to source value
        setValue(targetData, item.path, item.value);
      }
    }

    // Write updated target locale file
    try {
      await writeFile(configJson.type, targetFilePath, targetData);
      logger(`Synchronized ${missingItems.length} key(s) into "${targetLocale.file}" ✅`);
      totalKeysAdded += missingItems.length;
    } catch (e: any) {
      loggerError(`Failed saving synced file "${targetLocale.file}": ${e?.message}`);
    }
  }

  if (isDryRun) {
    logger(`Dry-run complete. Total missing keys identified across locales: ${totalKeysAdded}.`);
  } else {
    logger(`Sync completed successfully! Total keys added: ${totalKeysAdded}.`);
  }
}
