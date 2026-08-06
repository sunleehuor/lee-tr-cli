import os from 'os';
import path from 'path';
import constant from '../data/constant';
import { IConfig } from '../data/types/config';
import { writeFile } from './file';
import { loggerError, loggerWarning } from './logger';

export function objectKey(text: string) {
  text = text.replace(/\{.*?\}/g, '');
  const formattedText = text
    .replace(/[^\w\s]/g, '') // Remove special characters
    .split(' ') // Split into words
    .map((word, index) =>
      index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(''); // Join without any spaces

  return formattedText.slice(0, constant.LIMIT_OF_TRANSLATE_KEYS); // Limit to 20 characters
}

export function removeSpaceAndSpacialChar(text: string) {
  text = text.replace(/\{.*?\}/g, '');
  text = text.replace(/\.{2,}/g, '.'); // Collapse multiple dots into one

  const formattedText = text
    .replace(/[^\w\s.]/g, '')
    .split(' ')
    .map((word, index) =>
      index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join('');

  return formattedText.slice(0, constant.LIMIT_OF_TRANSLATE_KEYS);
}

export const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function removeQuotesFromJsonKeys(jsonString: string) {
  return jsonString.replace(/"([a-zA-Z0-9_]+)"\s*:/g, '$1:');
}

export async function cleanup(config: IConfig, reason: string) {
  const tmpPath = os.tmpdir();
  const prefix = constant.PREFIX;

  try {
    for (const locale of config.locales) {
      let text = undefined;
      try {
        text = (await import(path.join(tmpPath, prefix + '-' + locale.lang + '.json')))?.default;
      } catch {}

      if (text) {
        const textJson = typeof text ? text : {};
        await writeFile(config.type, path.join(process.cwd(), config.localePath, locale.file), textJson);
        // await deleteFile( path.join( tmpPath, prefix + "-" + locale.lang + '.json' ) );
      }
    }
    loggerWarning(`Cleanup reason:\n${reason}`);
  } catch (err) {
    loggerWarning(`Cleanup failed:\n${String(err)}`);
  }
}

export function textToNestedObject(path: string, value: any) {
  const keys = path.split('.').filter(Boolean);

  return keys.reduceRight((acc, key) => ({ [key]: acc }), value);
}

export function hasKeyOrObject(target: Record<string, any>, compare: Record<string, any>): boolean {
  try {
    // Search by key name
    if (typeof compare === 'string') {
      if (!target || typeof target !== 'object') return false;

      if (compare in target) return true;

      return Object.values(target).some((value) => hasKeyOrObject(value, compare));
    }

    // Compare object structure
    if (compare && typeof compare === 'object') {
      if (!target || typeof target !== 'object') return false;
      return Object.entries(compare).every(([key, compareValue]) => {
        if (!(key in target)) return false;

        const targetValue = target[key];

        // Target already has a primitive value.
        // Any deeper compare is considered existing.
        if (targetValue === null || typeof targetValue !== 'object' || Array.isArray(targetValue)) {
          return true;
        }

        // Both are objects -> continue recursively.
        if (compareValue && typeof compareValue === 'object') {
          return hasKeyOrObject(targetValue, compareValue);
        }

        return true;
      });
    }

    return false;
  } catch (e: any) {
    loggerError(e?.message);
    return false;
  }
}

export function deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (
      sourceValue &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      deepMerge(targetValue, sourceValue);
    } else {
      target[key] = sourceValue;
    }
  }

  return target;
}
