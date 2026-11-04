import { translate } from 'bing-translate-api';
import { LanguageCode } from '../data/types/lang';
import { loggerError } from './logger';

export interface IGetTranslate {
  text: string;
  from?: LanguageCode;
  to?: LanguageCode;
}

export interface IMaskResult {
  maskedText: string;
  variables: Record<string, string>;
}

/**
 * Protects template interpolation tags like {userName}, {{count}}, and <tag>content</tag>
 * from being mangled or translated by external translation APIs.
 */
export function maskVariables(text: string): IMaskResult {
  const variables: Record<string, string> = {};
  let counter = 0;

  const pattern = /(\{\{[\w.-]+\}\}|\{[\w.-]+\}|%[sdf]|<[a-zA-Z0-9]+>[^<]*<\/[a-zA-Z0-9]+>)/g;
  const maskedText = text.replace(pattern, (match) => {
    const placeholder = `__TR_VAR_${counter++}__`;
    variables[placeholder] = match;
    return placeholder;
  });

  return { maskedText, variables };
}

/**
 * Restores original interpolation tags into the translated text.
 */
export function unmaskVariables(text: string, variables: Record<string, string>): string {
  let result = text;
  for (const [placeholder, original] of Object.entries(variables)) {
    const escaped = placeholder.replace(/_/g, '[_\\s]?');
    const regex = new RegExp(escaped, 'gi');
    result = result.replace(regex, original);
  }
  return result;
}

export async function getTranslate({ text, from = 'auto-detect', to = 'en' }: IGetTranslate): Promise<string | undefined> {
  try {
    const { maskedText, variables } = maskVariables(text);
    const hasVariables = Object.keys(variables).length > 0;
    const textToSend = hasVariables ? maskedText : text;

    const tran = await translate(textToSend, from, to);
    const rawResult = tran?.translation;
    if (!rawResult) return undefined;

    return hasVariables ? unmaskVariables(rawResult, variables) : rawResult;
  } catch (e: any) {
    throw new Error(e?.message);
  }
}

/**
 * Recursively translates all string values in a nested object or array into the target language.
 * Preserves non-string primitives (numbers, booleans, null).
 */
export async function translateNestedObject(
  data: Record<string, any>,
  targetLocale: LanguageCode,
  sourceLocale: LanguageCode = 'auto-detect'
): Promise<Record<string, any>> {
  async function translateObject(obj: any): Promise<any> {
    const result: any = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        try {
          const translated = await getTranslate({
            text: value,
            from: sourceLocale,
            to: targetLocale,
          });

          result[key] = translated ?? value;
        } catch (e: any) {
          loggerError(`Translation failed for "${value}" to "${targetLocale}": ${e?.message}`);
          throw e;
        }
      } else if (value && typeof value === 'object') {
        result[key] = await translateObject(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  return translateObject(data);
}
