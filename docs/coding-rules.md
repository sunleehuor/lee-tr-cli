# Coding Rules & Guidelines

This document specifies the core engineering rules, safety principles, and operational standards for developing and maintaining the `lee-tr-cli` codebase.

---

## 1. TypeScript Strictness & Typing Standards

1. **Strict Type-Checking Enabled**:
   - `tsconfig.json` enforces `"strict": true` and `"noEmitOnError": true`.
   - All source code must compile cleanly without TypeScript diagnostics or compiler warnings.

2. **Minimize `any`**:
   - Avoid `any` wherever possible. Prefer explicit types, generics, `unknown` with type narrowing, or defined interfaces.
   - When handling dictionary data with dynamic nested structures, use `Record<string, unknown>` or a dedicated recursive structure:
     ```typescript
     // Recommended
     export type NestedRecord = { [key: string]: string | NestedRecord };

     // Discouraged
     let translate: Record<any, any> = {};
     ```

3. **Explicit Return Types on Public Functions**:
   - Every exported function in `src/command/` and `src/common/helper/` must declare an explicit return type:
     ```typescript
     // Correct
     export function getValueOfCommand(command: string): string | undefined { ... }

     // Discouraged
     export function getValueOfCommand(command: string) { ... }
     ```

4. **Literal Types and Type Assertions**:
   - Validate before asserting (`as LanguageCode`). Do not use unsafe type casting without verification.
   - Use `const` assertions for immutable configuration arrays:
     ```typescript
     export const LANGUAGE_CODES = ["en", "km", "ja", ...] as const;
     export type LanguageCode = typeof LANGUAGE_CODES[number];
     ```

---

## 2. Asynchronous vs. Synchronous File I/O Standards

> [!IMPORTANT]
> A critical rule: Never prefix synchronous Node.js `fs` methods with `await`.

1. **Avoid `await fs.*Sync`**:
   - `fs.existsSync`, `fs.readFileSync`, `fs.writeFileSync`, `fs.readdirSync`, and `fs.rmSync` are completely synchronous and return values/void directly.
   - Writing `await fs.existsSync(...)` creates misleading code and unnecessary microtask queueing.

2. **Standardization Rule**:
   - For file I/O operations, choose either consistent `fs.promises` (preferred for async helper methods) or explicit synchronous calls without `await`:

   ```typescript
   // Preferred: Pure Async with fs.promises
   import fs from 'fs/promises';

   export async function isFileExisting(filePath: string): Promise<boolean> {
     try {
       await fs.access(filePath);
       return true;
     } catch {
       return false;
     }
   }

   // Alternatively: Explicit Synchronous
   import fs from 'fs';

   export function isFileExistingSync(filePath: string): boolean {
     return fs.existsSync(filePath);
   }
   ```

---

## 3. Error Handling & Exit Codes

1. **Centralized Loggers**:
   - Never use raw `console.log` or `console.error` for user-facing CLI messages.
   - Use `logger`, `loggerWarning`, and `loggerError` from `src/common/helper/logger.ts`.

2. **Exit Code Semantics**:
   - Use `process.exit(0)` only on intentional graceful termination.
   - Use `process.exit(1)` when a command fails due to runtime errors, missing files, or validation failures:
     ```typescript
     if (!configJson) {
       loggerError('Configuration file could not be loaded.');
       process.exit(1);
     }
     ```

3. **Descriptive and Grammatically Correct Error Messages**:
   - Avoid broken English or misleading phrasing in error logs:
     - ❌ `Type not existing` ➔ ✅ `Missing required "type" field in configuration.`
     - ❌ `The km language is already exist on locales` ➔ ✅ `Locale "km" already exists in target locales.`
     - ❌ `Something wen wrong` ➔ ✅ `An unexpected error occurred during translation.`

---

## 4. CLI Safety, Temp Files & Rollback Lifecycle

1. **Atomic Rollback on Translation Failure**:
   - When modifying multiple locale files during `lee-tr t`, a failure midway through writing should not leave files corrupted or partially updated.
   - The CLI writes backup snapshots of each locale to `os.tmpdir()` (`lee-tr-<lang>.json`) before modifying the destination files.
   - If an error occurs during file writing, invoke `cleanup(configJson, 'ROLLBACK')` to restore all files to their pre-run state.

2. **Graceful Signal Handling**:
   - The application registers signal traps for `SIGINT` (Ctrl+C) and `SIGTERM` in `unMounted()` inside `src/bin/lee-tr.ts`.
   - Handlers must cleanly restore files and exit immediately:
     ```typescript
     process.on('SIGINT', async () => {
       await cleanup(configJson, 'SIGINT');
       process.exit(0);
     });
     ```

---

## 5. Input Validation Rules

1. **Command Line Arguments**:
   - Always sanitize and validate user-supplied keys using `removeSpaceAndSpecialChar` and length limits (`constant.LIMIT_OF_TRANSLATE_KEYS`).
   - Validate that strings read from clipboard are not purely whitespace.

2. **Configuration Validation Matrix**:
   Before executing any command (`t`, `add`, `check`), the CLI must validate:
   - Configuration exists and parses as valid JSON.
   - `type` is one of `'module' | 'commonjs' | 'json'`.
   - `localePath` is specified and points to an accessible directory.
   - `locales` is a non-empty array.
   - Every locale code exists in `LANGUAGE_CODES`.
   - Every target locale file exists on disk and matches the declared extension.

---

## 6. Dependency & Interop Guidelines

1. **ESM / CommonJS Interoperability**:
   - Packages like `clipboardy` (ESM-only in v5+) must be loaded asynchronously via dynamic `import()`:
     ```typescript
     export async function getClipBoardy() {
       const mod = await import('clipboardy');
       return mod.default;
     }
     ```
2. **Third-Party API Rate Limiting**:
   - `bing-translate-api` can be throttled or rate-limited. Batch queries through controlled concurrency using `constant.PAGINATION.CONCURRENT` and `constant.PAGINATION.LIMIT`.
