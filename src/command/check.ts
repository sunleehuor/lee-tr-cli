import path from 'path';
import fs from 'fs';
import { IConfig } from '../common/data/types/config';
import { TCheckStage } from '../common/data/types/check';
import { logger, loggerError, loggerWarning } from '../common/helper/logger';

export async function startCheckApp(configJson: IConfig): Promise<void> {
  try {
    const localePath = path.resolve(process.cwd(), configJson.localePath);

    if (!fs.existsSync(localePath)) {
      loggerError(`Locale directory "${localePath}" does not exist.`);
      process.exit(1);
    }

    const files = fs.readdirSync(localePath);
    const stages: Array<TCheckStage> = ['Check missing file'];

    for (const stage of stages) {
      switch (stage) {
        case 'Check missing file': {
          let hasIssue = false;
          for (const file of files) {
            const isConfigured = !!configJson.locales.find((d) => d.file === file);
            if (!isConfigured) {
              loggerWarning(`File check: "${file}" found on disk but missing from configuration locales.`);
              hasIssue = true;
            }
          }
          if (!hasIssue) {
            logger(`File check: All files in "${configJson.localePath}" match configuration ✅`);
          }
          break;
        }
        default:
          loggerWarning(`Unknown check stage: "${stage}".`);
          break;
      }
    }
  } catch (e: any) {
    loggerError(`Check command failed: ${e?.message}`);
    process.exit(1);
  }
}
