import fs from 'fs';
import os from 'os';
import path from 'path';
import { loggerError } from './logger';
import sampleDefaultJson from '../data/sample/defaultJson.json';
import sampleDefaultModule from '../data/sample/defaultModule';
import sampleDefaultCommon from '../data/sample/defaultCommon';
import { IPackageJson, IPackageJsonConfig, TConfigType } from '../data/types/config';
import constant from '../data/constant';

export function readJsonFile(filePath: string): any {
  try {
    const res = fs.readFileSync(filePath, {
      encoding: 'utf8',
    });
    return JSON.parse(res || '{}');
  } catch (e: any) {
    loggerError(`Failed to read JSON file at "${filePath}": ${e?.message}`);
    return undefined;
  }
}

export async function readTextFile(filePath: string): Promise<string> {
  try {
    return await fs.promises.readFile(filePath, {
      encoding: 'utf8',
    });
  } catch (e: any) {
    throw new Error(`Failed to read text file at "${filePath}": ${e?.message}`);
  }
}

export async function isFileExisting(targetPath: string): Promise<boolean> {
  try {
    await fs.promises.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export function isFileExistingSync(targetPath: string): boolean {
  return fs.existsSync(targetPath);
}

export async function getSampleFile(type: TConfigType = 'json'): Promise<any> {
  try {
    if (type === 'json') return sampleDefaultJson;
    if (type === 'commonjs') return sampleDefaultCommon;
    if (type === 'module') return sampleDefaultModule;
    return undefined;
  } catch {
    return undefined;
  }
}

export async function writeFile(type: TConfigType = 'json', targetPath: string, text: Record<any, any>): Promise<void> {
  try {
    let content = '';
    if (type === 'json') {
      content = JSON.stringify(text || {}, null, constant.FORMAT.SPACE);
    } else if (type === 'module') {
      content = `export default ${JSON.stringify(text || {}, null, constant.FORMAT.SPACE)}`;
    } else if (type === 'commonjs') {
      content = `module.exports = ${JSON.stringify(text || {}, null, constant.FORMAT.SPACE)}`;
    } else {
      throw new Error(`Invalid write file type`);
    }
    await fs.promises.writeFile(targetPath, content, 'utf8');
  } catch (e: any) {
    throw new Error(`Write file failed for "${targetPath}": ${e?.message}`);
  }
}

export async function writeTempFile(targetPath: string, text: any): Promise<void> {
  try {
    await fs.promises.writeFile(targetPath, JSON.stringify(text || {}, null, constant.FORMAT.SPACE), 'utf8');
  } catch (e: any) {
    throw new Error(`Write temporary file failed for "${targetPath}": ${e?.message}`);
  }
}

export async function deleteFile(targetPath: string): Promise<void> {
  try {
    await fs.promises.rm(targetPath, { force: true });
  } catch (e: any) {
    throw new Error(`Delete file failed for "${targetPath}": ${e?.message}`);
  }
}

export function getConfigFromPackageJson(): IPackageJsonConfig {
  try {
    const pkgPath = path.resolve(process.cwd(), 'package.json');
    if (!fs.existsSync(pkgPath)) {
      return {} as IPackageJsonConfig;
    }
    const json = readJsonFile(pkgPath) as IPackageJson;
    return json?.['lee-tr'] as IPackageJsonConfig;
  } catch {
    return {} as IPackageJsonConfig;
  }
}

export function resolveConfigPath(customPath?: string): string {
  const packageJsonConfig = getConfigFromPackageJson()?.configPath;
  return customPath || packageJsonConfig || path.resolve(process.cwd(), constant.DEFAULT_CONFIG_PATH);
}

export function getBackupFilePath(lang: string): string {
  return path.join(os.tmpdir(), `${constant.PREFIX}-${lang}.json`);
}

export function getLocaleExtension(type: TConfigType = 'json'): string {
  switch (type) {
    case 'json':
      return 'json';
    case 'commonjs':
      return 'js';
    case 'module':
      return 'ts';
    default:
      return 'json';
  }
}
