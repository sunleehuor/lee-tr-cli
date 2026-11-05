# Reusable Functions Catalog

This document is a reference catalog of all reusable utility and helper functions available across `src/common/helper/*`.

---

## Quick Navigation

- [Command Helpers (`command.ts`)](#1-command-helpers-srccommonhelpercommandts)
- [Logging Helpers (`logger.ts`)](#2-logging-helpers-srccommonhelperloggerts)
- [Translation Helpers & Variable Masking (`translate.ts`)](#3-translation-helpers--variable-masking-srccommonhelpertranslatets)
- [Configuration Helpers (`config.ts`)](#4-configuration-helpers-srccommonhelperconfigts)
- [Clipboard Injection (`inject.ts`)](#5-clipboard-injection-srccommonhelperinjectts)
- [File & I/O Helpers (`file.ts`)](#6-file--io-helpers-srccommonhelperfilets)
- [Common Transformations & State (`common.ts`)](#7-common-transformations--state-srccommonhelpercommonts)
- [Object Flattening, Path Access & Batching (`add.ts`)](#8-object-flattening-path-access--batching-srccommonhelperaddts)

---

## 1. Command Helpers (`src/common/helper/command.ts`)

### `getValueOfCommand(command: string): string | undefined`
Parses arguments passed to the Node process (`process.argv`) in `--key=value` format.

- **Parameters**: `command` (e.g. `'--filePath'`)
- **Returns**: Value string if found, otherwise `undefined`.
- **Example**:
  ```typescript
  import { getValueOfCommand } from '../common/helper/command';

  // Invocation: lee-tr t --filePath=./custom-config.json
  const customPath = getValueOfCommand('--filePath');
  // customPath === './custom-config.json'
  ```

---

## 2. Logging Helpers (`src/common/helper/logger.ts`)

Standardized console loggers for informational, warning, and error events.

### `logger(text: string): void`
Prints an informational message prefixed with `=====> `.

### `loggerWarning(text: string): void`
Prints a warning message prefixed with `⚠️ `.

### `loggerError(text: string): void`
Prints an error message prefixed with `🛑 `.

---

## 3. Translation Helpers & Variable Masking (`src/common/helper/translate.ts`)

### `maskVariables(text: string): IMaskResult`
Protects template interpolation tokens (e.g., `{userName}`, `{{count}}`, `<tag>content</tag>`) by replacing them with unique placeholder tokens (`__TR_VAR_0__`) before submitting to translation engines.

### `unmaskVariables(text: string, variables: Record<string, string>): string`
Restores original interpolation tokens back into the translated text.

### `getTranslate(params: IGetTranslate): Promise<string | undefined>`
Wraps `bing-translate-api` with automatic variable protection and error handling.

- **Interface**:
  ```typescript
  export interface IGetTranslate {
    text: string;
    from?: LanguageCode; // Defaults to 'auto-detect'
    to?: LanguageCode;   // Defaults to 'en'
  }
  ```
- **Example**:
  ```typescript
  import { getTranslate } from '../common/helper/translate';

  const result = await getTranslate({
    text: 'Hello {userName}',
    from: 'en',
    to: 'fr',
  });
  console.log(result); // "Bonjour {userName}"
  ```

### `translateNestedObject(data, targetLocale, sourceLocale?): Promise<Record<string, any>>`
Recursively translates all string values in a deeply nested object, dictionary, or array into the target language while preserving numbers, booleans, and data structures.

---

## 4. Configuration Helpers (`src/common/helper/config.ts`)

### `validateConfig(config: IConfig): Promise<boolean>`
Validates configuration integrity, ensuring `type`, `localePath`, `locales`, language codes, and physical file existence match requirements.

---

## 5. Clipboard Injection (`src/common/helper/inject.ts`)

### `getClipBoardy(): Promise<Clipboardy>`
Asynchronously imports and returns the ESM-only `clipboardy` package in a CommonJS runtime.

---

## 6. File & I/O Helpers (`src/common/helper/file.ts`)

### `readJsonFile(path: string): any`
Reads a UTF-8 JSON file and parses it. Returns `undefined` on failure.

### `readTextFile(path: string): Promise<string>`
Reads a UTF-8 text file asynchronously using `fs.promises.readFile`.

### `isFileExisting(path: string): Promise<boolean>`
Asynchronously checks whether a given file exists using `fs.promises.access`.

### `isFileExistingSync(path: string): boolean`
Synchronously checks whether a given file exists using `fs.existsSync`.

### `getSampleFile(type: TConfigType): Promise<any>`
Returns default empty structures based on configuration file type (`json`, `commonjs`, `module`).

### `writeFile(type: TConfigType, path: string, text: Record<any, any>): Promise<void>`
Formats and writes a translation object to a file matching the target format (`json`, `module`, or `commonjs`).

### `writeTempFile(path: string, text: any): Promise<void>`
Writes temporary JSON snapshot data for rollback/backup purposes asynchronously.

### `deleteFile(path: string): Promise<void>`
Asynchronously removes a file from disk using `fs.promises.rm(path, { force: true })`.

### `resolveConfigPath(customPath?: string): string`
Resolves the configuration file path by evaluating CLI arguments, `package.json`, and the fallback default (`lee-tr/config.json`).

### `getBackupFilePath(lang: string): string`
Returns the standardized temporary backup snapshot path for a given language code (`os.tmpdir()/lee-tr-<lang>.json`).

### `getConfigFromPackageJson(): IPackageJsonConfig`
Extracts the `"lee-tr"` configuration block from the project's root `package.json`.

### `getLocaleExtension(type: TConfigType): string`
Returns the expected file extension for a configuration type:
- `'json'` ➔ `'json'`
- `'commonjs'` ➔ `'js'`
- `'module'` ➔ `'ts'`

---

## 7. Common Transformations & State (`src/common/helper/common.ts`)

### `objectKey(text: string): string`
Converts arbitrary text (e.g. from clipboard) into a camelCase object key truncated to `LIMIT_OF_TRANSLATE_KEYS` (25 characters).

### `removeSpaceAndSpecialChar(text: string): string`
Sanitizes dot-notated key strings (e.g., `user.profile.first_name`), removing spaces and invalid characters while preserving key hierarchies. *(Note: `removeSpaceAndSpacialChar` is retained as a backward-compatible alias).*

### `isEnglish(text: string): boolean`
Determines whether a string consists solely of standard ASCII English characters, digits, spaces, and common punctuation.

### `textToNestedObject(path: string, value: any): Record<string, any>`
Converts dot-separated path string into a nested object.

### `hasKeyOrObject(target: Record<string, any>, compare: Record<string, any>): boolean`
Recursively verifies whether `compare`'s key path or object structure already exists inside `target`.

### `deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any>`
Deep merges `source` into `target` in-place, recursively combining nested objects while preserving existing sibling keys.

### `cleanup(config: IConfig, reason: string): Promise<void>`
Restores target locale files from backup files created in `os.tmpdir()` during failed executions or signal interrupts (`SIGINT`, `SIGTERM`).

---

## 8. Object Flattening, Path Access & Batching (`src/common/helper/add.ts`)

### `flattenObject(obj: Record<string, any>, path?: string[], result?: FlatItem[]): FlatItem[]`
Recursively converts nested dictionaries into a flat array of key paths and string values.

### `getValueByPath(obj: Record<string, any>, path: string[]): any`
Retrieves a nested value from an object given an array path (e.g. `['common', 'nav', 'home']`). Returns `undefined` if any key in the path does not exist.

### `setValue(obj: Record<string, any>, path: string[], value: any): void`
Sets a value inside a nested object following a path array, creating intermediate objects if necessary.

### `chunkArray<T>(arr: T[], size: number): T[][]`
Splits an array into chunks of length `size`.

### `unFlattenObject(flat: FlatItem[][]): Record<string, any>`
Reconstructs deep nested objects from an array of batches containing flat path items.
