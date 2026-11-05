import fs from 'fs';
import path from 'path';
import readline from 'readline/promises';
import constant from '../common/data/constant';
import { IConfig, TConfigType } from '../common/data/types/config';
import { LANGUAGE_CODES, LanguageCode } from '../common/data/types/lang';
import { getValueOfCommand } from '../common/helper/command';
import { getLocaleExtension, isFileExisting, isFileExistingSync, resolveConfigPath, writeFile } from '../common/helper/file';
import { logger, loggerError, loggerWarning } from '../common/helper/logger';

export async function startInitApp(): Promise<void> {
  const configPath = resolveConfigPath(getValueOfCommand(constant.COMMAND.CONFIG_FILE_PATH));
  const isForce = process.argv.includes('--force');
  const isYes = process.argv.includes('--yes') || process.argv.includes('-y');

  // Check if config already exists
  if (isFileExistingSync(configPath) && !isForce) {
    loggerWarning(`Configuration file already exists at "${configPath}". Use --force to overwrite.`);
    return;
  }

  // Parse flags or defaults
  let selectedType: TConfigType = (getValueOfCommand('--type') as TConfigType) || 'module';
  let localeDirectory: string = getValueOfCommand('--localePath') || 'src/locales';
  let defaultLang: LanguageCode = (getValueOfCommand('--defaultLocale') as LanguageCode) || 'en';
  let targetLangsRaw: string = getValueOfCommand('--locales') || 'km';

  // Interactive prompts if running in interactive terminal and --yes was not passed
  if (process.stdin.isTTY && !isYes) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      console.log('\n🚀 Welcome to lee-tr-cli Setup Wizard\n');

      const answerType = await rl.question('? Translation file format [module (TS) / json / commonjs (JS)] (default: module): ');
      if (answerType.trim()) {
        const normalized = answerType.trim().toLowerCase();
        if (['module', 'json', 'commonjs'].includes(normalized)) {
          selectedType = normalized as TConfigType;
        } else {
          loggerWarning(`Invalid format "${answerType}". Defaulting to "module".`);
        }
      }

      const answerPath = await rl.question('? Directory for translation files (default: src/locales): ');
      if (answerPath.trim()) {
        localeDirectory = answerPath.trim();
      }

      const answerDefault = await rl.question('? Default primary language code (default: en): ');
      if (answerDefault.trim()) {
        const normalized = answerDefault.trim().toLowerCase() as LanguageCode;
        if (LANGUAGE_CODES.includes(normalized)) {
          defaultLang = normalized;
        } else {
          loggerWarning(`Language code "${answerDefault}" not recognized. Defaulting to "en".`);
        }
      }

      const answerTargets = await rl.question('? Target languages (comma-separated, default: km): ');
      if (answerTargets.trim()) {
        targetLangsRaw = answerTargets.trim();
      }
    } finally {
      rl.close();
    }
  }

  // Normalize target languages
  const targetLangs: LanguageCode[] = targetLangsRaw
    .split(',')
    .map((s) => s.trim().toLowerCase() as LanguageCode)
    .filter((code) => code && code !== defaultLang && LANGUAGE_CODES.includes(code));

  if (targetLangs.length === 0) {
    targetLangs.push('km' as LanguageCode);
  }

  const extension = getLocaleExtension(selectedType);
  const fullLocaleDir = path.resolve(process.cwd(), localeDirectory);

  // 1. Create target directory
  try {
    await fs.promises.mkdir(fullLocaleDir, { recursive: true });
  } catch (e: any) {
    loggerError(`Failed to create directory "${fullLocaleDir}": ${e?.message}`);
    process.exit(1);
  }

  // 2. Prepare starter locale files
  const starterContent = {
    common: {
      greeting: 'Hello',
      welcome: 'Welcome to our application',
    },
  };

  const defaultFileName = `${defaultLang}.${extension}`;
  const defaultFilePath = path.join(fullLocaleDir, defaultFileName);
  try {
    await writeFile(selectedType, defaultFilePath, starterContent);
    logger(`Created starter reference locale: ${defaultFileName}`);
  } catch (e: any) {
    loggerError(`Failed to write starter locale file: ${e?.message}`);
    process.exit(1);
  }

  // 3. Create target locale files
  const localesConfig: IConfig['locales'] = [
    {
      lang: defaultLang,
      file: defaultFileName,
    },
  ];

  for (const targetLang of targetLangs) {
    const targetFileName = `${targetLang}.${extension}`;
    const targetFilePath = path.join(fullLocaleDir, targetFileName);
    try {
      await writeFile(selectedType, targetFilePath, {});
      localesConfig.push({
        lang: targetLang,
        file: targetFileName,
      });
      logger(`Created target locale file: ${targetFileName}`);
    } catch (e: any) {
      loggerError(`Failed to write target locale file "${targetFileName}": ${e?.message}`);
    }
  }

  // 4. Create and save config.json
  const fullConfigDir = path.dirname(configPath);
  try {
    await fs.promises.mkdir(fullConfigDir, { recursive: true });
    const configPayload: IConfig = {
      type: selectedType,
      defaultLocale: defaultLang,
      locales: localesConfig,
      localePath: localeDirectory,
    };

    await fs.promises.writeFile(configPath, JSON.stringify(configPayload, null, constant.FORMAT.SPACE), 'utf8');
    logger(`Configuration saved to "${configPath}" ✅`);
  } catch (e: any) {
    loggerError(`Failed to save configuration to "${configPath}": ${e?.message}`);
    process.exit(1);
  }

  console.log('\n🎉 Project initialized successfully!');
  console.log(`📁 Locales location: ${localeDirectory}`);
  console.log(`⚙️  Config file:      ${configPath}\n`);
  console.log('Next steps:');
  console.log('  1. Copy a phrase to your clipboard (e.g. "Submit Form")');
  console.log('  2. Run: npx lee-tr t button.submit');
  console.log('  3. Or run: npx lee-tr sync (to sync missing keys)\n');
}
