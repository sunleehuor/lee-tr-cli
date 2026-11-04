import fs from 'fs';
import path from 'path';
import constant from '../common/data/constant';
import { IConfig } from '../common/data/types/config';
import { LANGUAGE_CODES, LanguageCode } from '../common/data/types/lang';
import { chunkArray, flattenObject, unFlattenObject } from '../common/helper/add';
import { deepMerge } from '../common/helper/common';
import { getLocaleExtension, isFileExisting, writeFile } from '../common/helper/file';
import { logger, loggerError } from '../common/helper/logger';
import { translateNestedObject } from '../common/helper/translate';

export async function startAddApp(configJson: IConfig, configJsonPath: string): Promise<void> {
  const locale = process.argv?.[3] as LanguageCode;
  const defaultLangPath = path.resolve(process.cwd(), configJson.localePath, configJson?.locales?.[0]?.file);
  const extension = getLocaleExtension(configJson.type);

  // Validation
  if (!locale || !LANGUAGE_CODES.includes(locale)) {
    loggerError(`Adding a new language requires a valid locale code (e.g. "km", "ja").`);
    process.exit(1);
  }

  const newLocaleFilePath = path.resolve(process.cwd(), configJson.localePath, `${locale}.${extension}`);
  if (await isFileExisting(newLocaleFilePath)) {
    loggerError(`Locale file "${locale}.${extension}" already exists in "${configJson.localePath}".`);
    process.exit(1);
  }

  const isAlreadyInConfig = configJson.locales.some(
    (d) => d.lang.toLowerCase() === locale.toLowerCase() || d.file === `${locale}.${extension}`
  );
  if (isAlreadyInConfig) {
    loggerError(`Locale "${locale}" is already defined in configuration.`);
    process.exit(1);
  }

  // Read default locale values
  let defaultTranslate: Record<string, any> = {};
  try {
    const res = (await import(defaultLangPath))?.default;
    defaultTranslate = res || {};
  } catch (e: any) {
    loggerError(`Failed to import reference locale from "${defaultLangPath}": ${e?.message}`);
    process.exit(1);
  }

  logger('Translating keys, this may take a moment...');

  // Flatten and chunk for batch translation
  const concurrentLimit = constant.PAGINATION.CONCURRENT;
  const flattedObjectValue = flattenObject(defaultTranslate);
  const pages = chunkArray(flattedObjectValue, constant.PAGINATION.LIMIT).filter((d) => d?.length);

  const concurrentTranslate = pages.map((pageChunk) => {
    return translateNestedObject(unFlattenObject([pageChunk]), locale);
  });

  const results: Record<string, any>[] = [];
  try {
    for (let i = 0; i < concurrentTranslate.length; i += concurrentLimit) {
      const batch = concurrentTranslate.slice(i, i + concurrentLimit);
      const res = await Promise.all(batch);
      results.push(...res);
    }
  } catch (e: any) {
    loggerError(`Batch translation failed: ${e?.message}`);
    process.exit(1);
  }

  // Deep merge all translated chunks
  const translateNewLang: Record<string, any> = {};
  for (const item of results) {
    deepMerge(translateNewLang, item || {});
  }

  // Write new locale file
  try {
    await writeFile(configJson.type, newLocaleFilePath, translateNewLang);
  } catch (e: any) {
    loggerError(`Failed to write new locale file: ${e?.message}`);
    process.exit(1);
  }

  // Update configuration JSON file
  const newConfigLocale = {
    file: `${locale}.${extension}`,
    lang: locale,
  };

  try {
    const newConfig: IConfig = {
      ...configJson,
      locales: [...configJson.locales, newConfigLocale],
    };
    await fs.promises.writeFile(configJsonPath, JSON.stringify(newConfig, null, constant.FORMAT.SPACE), 'utf8');
    logger(`Locale "${locale}" added successfully!`);
  } catch (e) {
    loggerError(`Failed to update config file automatically. Please add manually to ${configJsonPath}:
      "locales": [
        ...
        ${JSON.stringify(newConfigLocale, null, 2)}
      ]
    `);
  }
}
