import { LanguageCode } from "./lang";

export type TConfigType = "module" | "json" | "commonjs";

export interface IConfig {
  type: TConfigType,
  defaultLocale: string,
  locales: Array<{
    lang: LanguageCode,
    file: string
  }>,
  localePath: string
}