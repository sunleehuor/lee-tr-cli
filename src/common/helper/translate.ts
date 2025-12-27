import { translate } from "bing-translate-api";
import { LanguageCode } from "../data/types/lang";

export interface IGetTranslate {
  text: string,
  from?: LanguageCode,
  to?: LanguageCode,
}

export async function getTranslate({
  text,
  from = 'auto-detect',
  to = 'en'
}: IGetTranslate) {
  try {
    const tran = await translate(text, from, to);
    return tran?.translation;
  }catch(e: any) {
    throw new Error(e?.message);
  }
}