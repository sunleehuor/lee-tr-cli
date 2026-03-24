import { IConfig } from "../common/data/types/config";
import path from "path";
import fs from "fs";
import { TCheckStage } from "../common/data/types/check";
import { logger, loggerWarning } from "../common/helper/logger";

export async function startCheckApp(configJson: IConfig) {
    try {
        const localePath = path.resolve(process.cwd(), configJson.localePath);
        const files = await fs.readdirSync(localePath);
        const stags: Array<TCheckStage> = [
            "Check missing file"
        ];

        for( const stag of stags ) {
            switch(stag) {
                case "Check missing file":
                    let isGood = true;
                    for ( const file of files ) {
                        const isExist = !!configJson.locales.find(d => d.file == file);
                        if(!isExist) {
                            loggerWarning(`* Checking file: The file ${file} is missing on locale config.`)
                            isGood = false;
                        }
                    }
                    if(isGood) logger(`* Checking file: ✅`) 
                    break;
                default:
                    logger(`Checking failed`);
            }
        }
    }catch(e: any) {
        console.log(e);
    }
}