import path from 'path';
import constant from '../common/data/constant';
import { IConfig } from '../common/data/types/config';
import {
  cleanup,
  deepMerge,
  hasKeyOrObject,
  isEnglish,
  objectKey,
  removeSpaceAndSpecialChar,
  textToNestedObject,
} from '../common/helper/common';
import { getBackupFilePath, getSampleFile, writeFile, writeTempFile } from '../common/helper/file';
import { getClipBoardy } from '../common/helper/inject';
import { logger, loggerError, loggerWarning } from '../common/helper/logger';
import { getTranslate } from '../common/helper/translate';

export async function startTApp(configJson: IConfig): Promise<void> {
  const clipboardy = await getClipBoardy();
  const LIMIT_OF_TRANSLATE_KEYS = constant.LIMIT_OF_TRANSLATE_KEYS;
  const defaultKeys = process.argv?.[3];
  let keys = '';

  // 1. Resolve and sanitize translation key
  try {
    logger('Checking translation keys...');
    const rawKey = defaultKeys?.trim() ?? '';
    const cleanKeys = removeSpaceAndSpecialChar(rawKey) || objectKey(await clipboardy.read());
    keys = cleanKeys;
    logger('Translation keys verified.');
  } catch (e: any) {
    loggerError(`Translation keys must be valid: ${e?.message}`);
    process.exit(1);
  }

  try {
    const afterTranslateKey = isEnglish(keys)
      ? keys
      : await getTranslate({
          text: keys,
        });

    const afterSliceKey = defaultKeys ? afterTranslateKey : afterTranslateKey?.slice(0, LIMIT_OF_TRANSLATE_KEYS);
    if (afterSliceKey) {
      keys = afterSliceKey;
      logger(`Translation key: "${keys}"`);
    }
  } catch (e: any) {
    loggerError(`Failed to process key translation: ${e?.message}`);
    process.exit(1);
  }

  // 2. Load current locale content and create backup snapshots
  const translate: Record<string, any> = {};

  for (const locale of configJson.locales) {
    try {
      const filePath = path.join(process.cwd(), configJson.localePath, locale.file);
      let text = undefined;
      try {
        text = (await import(filePath))?.default;
      } catch {}

      const backupPath = getBackupFilePath(locale.lang);
      if (!text || !Object.keys(text)?.length) {
        const sampleText = await getSampleFile(configJson.type);
        translate[locale.file] = sampleText;
        await writeTempFile(backupPath, sampleText);
      } else {
        translate[locale.file] = text;
        await writeTempFile(backupPath, text);
      }
    } catch (e: any) {
      loggerError(`Failed loading locale "${locale.file}": ${e?.message || 'Unexpected error'}`);
      process.exit(1);
    }
  }

  // 3. Read text to translate from clipboard
  let value = '';
  try {
    value = await clipboardy.read();
    if (!value || !value.trim()) {
      loggerError('The text to translate cannot be empty or only whitespace.');
      process.exit(1);
    }
  } catch (e: any) {
    loggerError(`Clipboard is empty or could not be read: ${e?.message}`);
    process.exit(1);
  }

  // 4. Translate value for each target locale and merge
  for (const locale of configJson.locales) {
    try {
      const valueTran = await getTranslate({
        text: value,
        from: 'auto-detect',
        to: locale.lang,
      });

      const translateKeysValue = textToNestedObject(keys, valueTran ?? value);
      const isExisting = hasKeyOrObject(translate[locale.file] || {}, translateKeysValue);

      if (!isExisting) {
        translate[locale.file] = deepMerge(translate[locale.file] || {}, translateKeysValue);
      } else {
        loggerWarning(`Key "${keys}" already exists in "${locale.file}". Skipping.`);
      }
    } catch (e: any) {
      loggerError(`Translation failed for locale "${locale.lang}": ${e?.message}`);
      process.exit(1);
    }
  }

  // 5. Write updated translations to disk with rollback protection
  for (const [fileName, fileContent] of Object.entries(translate)) {
    try {
      const writePath = path.join(process.cwd(), configJson.localePath, fileName);
      await writeFile(configJson.type, writePath, fileContent);
    } catch (e: any) {
      loggerError(`Failed saving "${fileName}": ${e?.message}`);
      await cleanup(configJson, 'ROLLBACK');
      process.exit(1);
    }
  }

  logger('Translation completed successfully!');
}
