import { IConfig } from '../common/data/types/config';
import { LANGUAGE_CODES, LanguageCode } from '../common/data/types/lang';
import { getLocaleExtension, isFileExisting, writeFile } from '../common/helper/file';
import { logger, loggerError } from '../common/helper/logger';
import path from 'path';
import fs from 'fs';
import constant from '../common/data/constant';
import { getTranslate } from '../common/helper/translate';

async function GetTranslate(translates: [string, string][], index: number, locale: LanguageCode) {
  let result: { [index]: Record<string, string> } = {};
  for (const item of translates) {
    try {
      const translateText = await getTranslate({
        text: item?.[1],
        to: locale,
      });
      if (translateText) {
        result[index] = {
          ...result[index],
          [item[0]]: translateText,
        };
      }
    } catch (e: any) {
      loggerError(`Translate failed: ${e?.message}`);
      process.exit(1);
    }
  }
  return result;
}

export async function startAddApp(configJson: IConfig, configJsonPath: string) {
  const locale = process.argv?.[3] as LanguageCode;
  const defaultLangPath = path.resolve(process.cwd(), configJson.localePath, configJson?.locales?.[0]?.file);
  const extension = getLocaleExtension(configJson.type);

  // Validation
  if (!locale || !LANGUAGE_CODES.find((d) => d == locale)) {
    loggerError(`Adding new language require locale or need exist locale keys`);
    return;
  }

  if (await isFileExisting(path.resolve(process.cwd(), configJson.localePath, locale + '.' + extension))) {
    loggerError(`The ${locale} language is already exist on locales`);
    return;
  }

  if (
    !!configJson.locales.find(
      (d) => d.lang.toLocaleLowerCase() == locale.toLocaleLowerCase() || d.file == locale + '.' + extension
    )
  ) {
    loggerError(`This locale keys already exist`);
    return;
  }

  // Read default value
  let defaultTranslate: Record<string, string> = {};
  try {
    const res = (await import(defaultLangPath))?.default;
    defaultTranslate = res;
  } catch (e: any) {
    loggerError(`Import default value failed: ${e?.message}`);
    return;
  }

  logger('Please waiting value is translating may take a bit long...');

  // Translate keys
  const limit = constant.PAGINATION.LIMIT;
  const concurrentLimit = constant.PAGINATION.CONCURRENT;
  const pagination = Math.ceil(Object.entries(defaultTranslate).length / limit);
  let translateNewLang: Record<string, string> = {};

  const concurrentTranslate = Array.from({ length: pagination }).map((_, index) => {
    return GetTranslate(
      Object.entries(defaultTranslate).slice(limit * index, limit * (index == 0 ? 1 : index + 1)),
      index,
      locale
    );
  });

  const results = [];
  for (let i = 0; i < concurrentTranslate.length; i += concurrentLimit) {
    const batch = concurrentTranslate.slice(i, i + concurrentLimit);
    const res = await Promise.all(batch);
    results.push(...res);
  }

  results
    .sort((a, b) => {
      const keyA = Number(Object.keys(a)[0]);
      const keyB = Number(Object.keys(b)[0]);
      return keyA - keyB;
    })
    .forEach((item, index) => {
      translateNewLang = {
        ...translateNewLang,
        ...(item?.[index] || {}),
      };
    });

  // Modified config json file
  try {
    await writeFile(
      configJson.type,
      path.resolve(process.cwd(), configJson.localePath, locale + '.' + extension),
      translateNewLang
    );
  } catch (e: any) {
    loggerError(`Write file failed: ${e?.message}`);
    return;
  }

  const newConfigLocale = {
    file: locale + '.' + extension,
    lang: locale,
  };

  try {
    const newConfig: IConfig = {
      ...configJson,
      locales: [...configJson.locales, newConfigLocale],
    };
    await fs.writeFileSync(configJsonPath, JSON.stringify(newConfig, null, constant.FORMAT.SPACE));
    logger('Added Successfully');
  } catch (e) {
    loggerError(`Modified config file failed, you can modify manually\n
      {
        locales: [
          ${JSON.stringify(newConfigLocale, null, 2)}
        ]
      }
    `);
  }
}
