import path from 'path';
import { IConfig } from '../data/types/config';
import { LANGUAGE_CODES, LanguageCode } from '../data/types/lang';
import { isFileExisting } from './file';
import { loggerError } from './logger';

export interface IValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Validates the loaded configuration object against schema and disk state.
 *
 * @param config - The parsed configuration object.
 * @returns True if valid, false otherwise (errors logged).
 */
export async function validateConfig(config: IConfig): Promise<boolean> {
  if (!config) {
    loggerError('Configuration file is empty or could not be loaded.');
    return false;
  }

  // Validate package type
  if (!config.type) {
    loggerError('Configuration error: "type" is missing.');
    return false;
  }

  const validTypes = ['commonjs', 'module', 'json'];
  if (!validTypes.includes(config.type)) {
    loggerError(`Configuration error: "type" must be one of: ${validTypes.join(', ')}.`);
    return false;
  }

  // Validate locale path
  if (!config.localePath) {
    loggerError('Configuration error: "localePath" is missing.');
    return false;
  }

  // Validate locales list
  if (!config.locales || !Array.isArray(config.locales) || config.locales.length === 0) {
    loggerError('Configuration error: "locales" must be a non-empty array.');
    return false;
  }

  // Validate language codes
  const validCodes = LANGUAGE_CODES.map((d) => d.toLowerCase());
  for (const locale of config.locales) {
    if (!validCodes.includes(locale.lang.toLowerCase() as LanguageCode)) {
      loggerError(`Configuration error: Language code "${locale.lang}" is not supported. Check docs for valid codes.`);
      return false;
    }
  }

  // Validate physical file existence and file extension match
  for (const locale of config.locales) {
    const fullFilePath = path.join(process.cwd(), config.localePath, locale.file);
    try {
      const exists = await isFileExisting(fullFilePath);
      if (!exists) {
        loggerError(`Locale file not found: "${fullFilePath}" does not exist.`);
        return false;
      }

      const isMatch =
        (config.type === 'json' && locale.file.endsWith('.json')) ||
        (config.type === 'commonjs' && (locale.file.endsWith('.js') || locale.file.endsWith('.cjs'))) ||
        (config.type === 'module' && (locale.file.endsWith('.ts') || locale.file.endsWith('.js') || locale.file.endsWith('.mjs')));

      if (!isMatch) {
        loggerError(`File format mismatch: File "${locale.file}" does not match configured type "${config.type}".`);
        return false;
      }
    } catch {
      loggerError(`Failed to access locale file: "${fullFilePath}".`);
      return false;
    }
  }

  return true;
}
