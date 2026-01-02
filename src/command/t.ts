import { getValueOfCommand } from "../common/helper/command";
import { getSampleFile, readJsonFile, readTextFile, writeFile, writeTempFile } from "../common/helper/file";
import path from "path";
import { logger, loggerError, loggerWarning } from "../common/helper/logger";
import { IConfig } from "../common/data/types/config";
import clipboardy from "clipboardy";
import { getTranslate } from "../common/helper/translate";
import constant from "../common/data/constant";
import { cleanup, removeSpaceAndSpacialChar, wait } from "../common/helper/common";
import os from "os";

export async function startTApp() {
    // Global var
    const LIMIT_OF_TRANSLATE_KEYS = constant.LIMIT_OF_TRANSLATE_KEYS;
    const filePath = getValueOfCommand(constant.COMMAND.CONFIG_FILE_PATH) || path.resolve(process.cwd(), constant.DEFAULT_CONFIG_PATH);
    const defaultKeys = process.argv?.[3];
    let keys = '';

    try {
        logger("Checking translate keys...");
        keys = defaultKeys?.trim() || await clipboardy.read();
        logger("Checked translate keys");
    } catch(e: any) {
        loggerError('Translate keys must be valid.' + ' ' + e?.message);
        process.exit(0);
    }

    try {
        const afterTranslateKey = await getTranslate({
            text: keys
        });
        const afterSliceKey =  (defaultKeys ? afterTranslateKey : afterTranslateKey?.slice(0, LIMIT_OF_TRANSLATE_KEYS));
        if(afterSliceKey) {
            const value = removeSpaceAndSpacialChar(afterSliceKey);
            keys = value;
            logger(`Your translate keys (${value})`);
        };
    }catch(e: any) {
        loggerError(e?.message);
        process.exit(0);
    }

    // Logic
    const configJson = readJsonFile(filePath) as IConfig;
    if( !configJson ) return;

    let translate: Record<any, any> = {};
    let tempTranslate: Record<any, any> = {};
    for( const locale of configJson.locales ) {
        try{
            const filePath = path.join( process.cwd(), configJson?.localePath, locale?.file );
            let text = undefined;
            try{
                text = (await import( filePath ))?.default
            }catch {}
            if(!text || !Object.keys(text)?.length ) {
                const sampleText = await getSampleFile(configJson?.type);
                translate[locale?.file] = sampleText;
                tempTranslate[locale?.file] = sampleText;
                await writeTempFile( path.join(os.tmpdir(), constant.PREFIX + "-" + locale.lang + '.json'), sampleText);
            } else {
                translate[locale?.file] = text;
                tempTranslate[locale?.file] = text;
                await writeTempFile( path.join(os.tmpdir(), constant.PREFIX + "-" + locale.lang) + '.json', text);
            }
        }catch(e: any) {
            loggerError(e?.message || "Something wen wrong");
            process.exit(0);
        }
    }

    // Clear tmp value
    tempTranslate = {};

    // Read Value
    let value = "";
    try {
        value = await clipboardy.read();
        if(!value.trim()) {
            loggerError("The translate text must be not only whitespace or space");
            process.exit(0);
        }
    } catch(e: any) {
        loggerError("Your copied board must be not empty. " + e?.message);
        process.exit(0);
    }

    // Translate
    for( const locale of configJson.locales) {
        try {
            const valueTran = await getTranslate({
                text: value,
                from: "auto-detect",
                to: locale.lang
            });

            if( !Object.keys(translate?.[locale.file] || {}).filter(d => d.toLocaleLowerCase() == keys.toLocaleLowerCase())?.length ) {
                translate[locale.file] = {
                    ...translate[locale.file],
                    [keys]: valueTran
                }
            } else {
                loggerWarning(`This ${keys} keys is existing in ${locale.file}`);
            }
        } catch(e: any) {
            loggerError(`Translate failed: ${e?.message}`);
            process.exit(0);
        }
    }

    for( const tran of Object.entries(translate) ) {
        try{
            const writePath = path.join( process.cwd(), configJson.localePath, tran[0]);
            await writeFile( configJson.type, writePath, tran[1]);
            }catch(e: any) {
            loggerError(e?.message);
            await cleanup(configJson, "ROLLBACK");
            process.exit(0);
    }
}

    // Unmounted
    logger("Translate completed");
}