import os from "os";
import path from "path";
import constant from "../data/constant";
import { IConfig } from "../data/types/config";
import { writeFile } from "./file";
import { loggerWarning } from "./logger";

export function removeSpaceAndSpacialChar(text: string) {
  text = text.replace(/\{.*?\}/g, "");
  const formattedText = text.replace(/[^\w\s]/g, "") // Remove special characters
    .split(" ") // Split into words
    .map((word, index) => 
      index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(""); // Join without any spaces

  return formattedText.slice(0, constant.LIMIT_OF_TRANSLATE_KEYS); // Limit to 20 characters
}

export const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export function removeQuotesFromJsonKeys(jsonString: string) {
  return jsonString.replace(/"([a-zA-Z0-9_]+)"\s*:/g, '$1:');
}

export   async function cleanup(config: IConfig, reason: string) {
    const tmpPath = os.tmpdir();
    const prefix = constant.PREFIX;

    try {
      for(const locale of config.locales) {
        let text = undefined;
        try{
          text = (await import(path.join( tmpPath, prefix + "-" + locale.lang + '.json' )))?.default;
        }catch {}
        
        if(text) {
          const textJson = typeof text ? text : {};
          await writeFile( config.type, path.join( process.cwd(), config.localePath, locale.file ),  textJson);
          // await deleteFile( path.join( tmpPath, prefix + "-" + locale.lang + '.json' ) );
        }
      }
      loggerWarning(`Cleanup reason:\n${reason}`);
    } catch (err) {
      loggerWarning(`Cleanup failed:\n${String(err)}`);
    }
  }