import path from 'path';
import constant from '../data/constant';
import { IConfig } from '../data/types/config';
import { getBackupFilePath, isFileExisting, writeFile } from './file';
import { loggerError, loggerWarning } from './logger';

export function objectKey(text: string): string {
  text = text.replace(/\{.*?\}/g, '');
  const formattedText = text
    .replace(/[^\w\s]/g, '') // Remove special characters
    .split(' ') // Split into words
    .map((word, index) =>
      index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(''); // Join without any spaces

  return formattedText.slice(0, constant.LIMIT_OF_TRANSLATE_KEYS);
}

export function removeSpaceAndSpecialChar(text: string): string {
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

// Backward-compatible alias for the previous typo
export const removeSpaceAndSpacialChar = removeSpaceAndSpecialChar;

export const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function removeQuotesFromJsonKeys(jsonString: string): string {
  return jsonString.replace(/"([a-zA-Z0-9_]+)"\s*:/g, '$1:');
}

export async function cleanup(config: IConfig, reason: string): Promise<void> {
  try {
    for (const locale of config.locales) {
      const backupPath = getBackupFilePath(locale.lang);
      if (!(await isFileExisting(backupPath))) {
        continue;
      }

      let text: any = undefined;
      try {
        text = (await import(backupPath))?.default;
      } catch {}

      if (text) {
        const textJson = text && typeof text === 'object' ? text : {};
        const destPath = path.join(process.cwd(), config.localePath, locale.file);
        await writeFile(config.type, destPath, textJson);
      }
    }
    loggerWarning(`Cleanup triggered (reason: ${reason}). Restored locale files from snapshot.`);
  } catch (err: any) {
    loggerWarning(`Cleanup failed: ${err?.message || String(err)}`);
  }
}

export function textToNestedObject(pathStr: string, value: any): Record<string, any> {
  const keys = pathStr.split('.').filter(Boolean);
  return keys.reduceRight((acc, key) => ({ [key]: acc }), value);
}

export function hasKeyOrObject(target: Record<string, any>, compare: Record<string, any>): boolean {
  try {
    // Search by key name string
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

        // Target already has a primitive value. Any deeper compare is considered existing.
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
    loggerError(`Key collision check failed: ${e?.message}`);
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

export function isEnglish(text: string): boolean {
  return /^[A-Za-z0-9\s.,!?'"():;@#$%^&*+=/_\-`~[\]{}<>|\\]*$/.test(text);
}
