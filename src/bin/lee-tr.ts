#!/usr/bin/env node

// Helper
import { getValueOfCommand } from "../common/helper/command";
import path from "path";
import { loggerError, loggerWarning } from "../common/helper/logger";
import { deleteFile, isFileExisting, readJsonFile, readTextFile, writeFile } from "../common/helper/file";
import { startTApp } from "../command/t";
import os from "os";
import fs from "fs/promises";
import { IConfig } from "../common/data/types/config";
import { LANGUAGE_CODES, LanguageCode } from "../common/data/types/lang";
import constant from "../common/data/constant";

function unMounted() {
  /**
   * Global validation
  */
  const filePath = getValueOfCommand(constant.COMMAND.CONFIG_FILE_PATH) || path.resolve(process.cwd(), constant.DEFAULT_CONFIG_PATH);
  
  // Logic
  const configJson = readJsonFile(filePath) as IConfig;
  if (!configJson) return;

  async function cleanup(reason: string) {
    const tmpPath = os.tmpdir();
    const prefix = constant.PREFIX;

    try {
      for(const locale of configJson.locales) {
        let text = undefined;
        try{
          text = await readTextFile(path.join( tmpPath, prefix + "-" + locale.lang ));
          text = JSON.parse(text || "{}");
        }catch {}
        
        if(text) {
          const textJson = JSON.parse(text);
          await writeFile( configJson.type, path.join( process.cwd(), configJson.localePath, locale.file ),  textJson);
          // await deleteFile( path.join( tmpPath, prefix + "-" + locale.lang ) );
        }
      }
      loggerWarning(`Cleanup reason:\n${reason}`);
    } catch (err) {
      loggerWarning(`Cleanup failed:\n${String(err)}`);
    }
  }

  process.on('SIGINT', async () => {
    await cleanup('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await cleanup('SIGTERM');
    process.exit(0);
  });

  process.on('exit', (code) => {
    // cleanup(`exit:${code}`);
  });

  process.on('uncaughtException', async (err) => {
    console.error(err);
    await cleanup('uncaughtException');
    process.exit(1);
  });
}

async function bootstrap() {
    // Global var
    const cmd = process.argv?.[2];
    
    /**
     * Global validation
     */
    const filePath =
      getValueOfCommand(constant.COMMAND.CONFIG_FILE_PATH) ||
      path.resolve(process.cwd(), constant.DEFAULT_CONFIG_PATH);
    
    // Logic
    const configJson = readJsonFile(filePath) as IConfig;
    
    if (!configJson) return;
    
    // package type
    if (!configJson?.type) {
      loggerError("Type not existing");
      return;
    }
    
    if (!["commonjs", "module", "json"].includes(configJson?.type)) {
      loggerError("Type must be commonjs, module, json not existing");
      return;
    }
    
    // Locale path
    if (!configJson?.localePath) {
      loggerError("Configuration { localePath: '' } not existing");
      return;
    }
    
    // Locals list
    if (
      !configJson?.locales ||
      (Array.isArray(configJson?.locales) && !configJson?.locales?.length)
    ) {
      loggerError("Configuration { locales: '' } not existing");
      return;
    }

    // Checking lang key
    for(const local of configJson.locales) {
      if( !LANGUAGE_CODES.includes(local.lang.toLocaleLowerCase() as LanguageCode) ) {
        loggerError(`lang: "${local.lang}" is not exiting. check more on docs.`);
        process.exit(0);
      }
    }
    
    // check local path existing
    for (const locale of configJson.locales) {
      const errorMessage = `${locale?.file} not existing`;
      try {
        const existing = await isFileExisting(
          path.join(configJson?.localePath, locale?.file)
        );
        if (!existing) {
          loggerError(errorMessage);
          process.exit(0);
        } 
        if(
            !(
                (configJson?.type == "json" && locale?.file?.includes(".json")) ||
                (configJson?.type == "commonjs" && locale?.file?.includes(".js")) ||
                (configJson?.type == "module" && locale?.file?.includes(".ts"))
            )
        ) {
            loggerError(`Config type and file not match format. check docs more details`);
            process.exit(0);
        }
      } catch {
        loggerError(errorMessage);
        process.exit(0);
      }
    }
    
    // Command switch case
    switch (cmd) {
      case "t":
        startTApp();
        break;
      case "add":
        break;
      default:
        loggerError("Command not existing. please try --help for more detail");
        break;
    }
}

bootstrap();
unMounted();