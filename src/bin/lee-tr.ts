#!/usr/bin/env node

import path from 'path';
import constant from '../common/data/constant';
import { IConfig } from '../common/data/types/config';
import { getValueOfCommand } from '../common/helper/command';
import { cleanup } from '../common/helper/common';
import { validateConfig } from '../common/helper/config';
import { readJsonFile, resolveConfigPath } from '../common/helper/file';
import { logger, loggerError } from '../common/helper/logger';
import { startAddApp } from '../command/add';
import { startCheckApp } from '../command/check';
import { startInitApp } from '../command/init';
import { startSyncApp } from '../command/sync';
import { startTApp } from '../command/t';

function setupLifecycleHooks(configFilePath: string): void {
  const configJson = readJsonFile(configFilePath) as IConfig;
  if (!configJson) return;

  process.on('SIGINT', async () => {
    await cleanup(configJson, 'SIGINT (user interrupt)');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await cleanup(configJson, 'SIGTERM (termination signal)');
    process.exit(0);
  });

  process.on('uncaughtException', async (err) => {
    loggerError(`Uncaught exception: ${err.message}`);
    process.exit(1);
  });
}

async function bootstrap(): Promise<void> {
  const start = process.hrtime();
  const cmd = process.argv?.[2];

  // Handle 'init' command independently (before config exists)
  if (cmd === 'init') {
    await startInitApp();
    const diff = process.hrtime(start);
    logger(`Execution completed in ${diff[0]}s ${(diff[1] / 1e6).toFixed(2)}ms.`);
    return;
  }

  // Resolve configuration path
  const configFilePath = resolveConfigPath(getValueOfCommand(constant.COMMAND.CONFIG_FILE_PATH));

  // Load and parse configuration
  const configJson = readJsonFile(configFilePath) as IConfig;
  if (!configJson) {
    loggerError(`Could not find or parse configuration file at "${configFilePath}". Run "lee-tr init" to create one.`);
    process.exit(1);
  }

  // Setup process termination hooks
  setupLifecycleHooks(configFilePath);

  // Validate configuration schema and files
  const isValid = await validateConfig(configJson);
  if (!isValid) {
    process.exit(1);
  }

  // Dispatch command
  switch (cmd) {
    case 't':
      await startTApp(configJson);
      break;
    case 'add':
      await startAddApp(configJson, configFilePath);
      break;
    case 'check':
      await startCheckApp(configJson);
      break;
    case 'sync':
      await startSyncApp(configJson);
      break;
    default:
      loggerError(`Unknown command "${cmd ?? ''}". Available commands: t, add, check, sync, init.`);
      process.exit(1);
  }

  // Log execution duration
  const diff = process.hrtime(start);
  const seconds = diff[0];
  const milliseconds = (diff[1] / 1e6).toFixed(2);
  logger(`Execution completed in ${seconds}s ${milliseconds}ms.`);
}

bootstrap();
