# Naming Conventions

Consistent naming conventions are essential for code discoverability, maintainability, and clean architecture across `lee-tr-cli`.

---

## 1. File and Directory Naming

### Directories
- Use single lowercase words or `kebab-case` for all folder names.
- Examples:
  - `src/bin`
  - `src/command`
  - `src/common/data`
  - `src/common/data/sample`
  - `src/common/data/types`
  - `src/common/helper`
  - `docs`

### Files
- **TypeScript Source Files**: Use lowercase `kebab-case` or `camelCase` describing the primary module responsibility:
  - CLI entrypoint: `src/bin/lee-tr.ts`
  - Helpers: `src/common/helper/file.ts`, `src/common/helper/common.ts`, `src/common/helper/translate.ts`
  - Command handlers: named matching the CLI sub-command name, e.g. `t.ts`, `add.ts`, `check.ts`
  - Sample templates: `defaultCommon.ts`, `defaultJson.json`, `defaultModule.ts`
- **Documentation**: Use lowercase `kebab-case` with `.md` extension:
  - `coding-rules.md`, `naming-conventions.md`, `reusable-functions.md`

---

## 2. Type and Interface Conventions

| Entity | Pattern | Prefix | Example |
| :--- | :--- | :--- | :--- |
| **Interface** | `IPascalCase` | `I` | `IConfig`, `IPackageJson`, `IPackageJsonConfig`, `IGetTranslate` |
| **Type Alias** | `TPascalCase` or `PascalCase` | `T` (preferred for unions) | `TConfigType`, `TCheckStage`, `LanguageCode`, `FlatItem` |
| **Enum / Const Assertions** | `UPPER_SNAKE_CASE` | None | `LANGUAGE_CODES` |

### Interface Example
```typescript
export interface IConfig {
  type: TConfigType;
  defaultLocale: string;
  locales: Array<{
    lang: LanguageCode;
    file: string;
  }>;
  localePath: string;
}
```

### Type Alias Example
```typescript
export type TConfigType = 'module' | 'json' | 'commonjs';
export type TCheckStage = 'Check missing file' | 'Check missing keys';
```

---

## 3. Function Naming Conventions

### Function Standard: `camelCase`
All functions—both exported utilities and local helpers—must follow `camelCase`.

| Category | Recommended Pattern | Examples |
| :--- | :--- | :--- |
| **Command Starters** | `start<CommandName>App` | `startTApp`, `startAddApp`, `startCheckApp` |
| **Boolean Predicates** | `is<Condition>`, `has<Property>` | `isFileExisting`, `isEnglish`, `hasKeyOrObject` |
| **Readers / Fetchers** | `get<Noun>`, `read<Noun>` | `getValueOfCommand`, `readJsonFile`, `getTranslate` |
| **Writers / Mutators** | `write<Noun>`, `delete<Noun>`, `set<Noun>` | `writeFile`, `writeTempFile`, `deleteFile`, `setValue` |
| **Transformations** | `<transform><Noun>` | `flattenObject`, `unFlattenObject`, `chunkArray`, `textToNestedObject` |

### ⚠️ Anti-Patterns to Avoid:
- **Do not use PascalCase for functions**:
  - ❌ `async function GetTranslate(...)` (in `src/command/add.ts`)
  - ✅ `async function translateObjectTree(...)` or `async function getDeepTranslation(...)`

---

## 4. Variables and Parameters

### Local Variables & Arguments
- Use `camelCase` for variable names and function arguments:
  ```typescript
  const defaultLangPath = path.resolve(process.cwd(), configJson.localePath);
  const flattedObjectValue = flattenObject(defaultTranslate);
  ```

### Constants
- Use `UPPER_SNAKE_CASE` for file-level or exported global configuration constants:
  ```typescript
  export const LIMIT_OF_TRANSLATE_KEYS = 25;
  export const DEFAULT_CONFIG_PATH = 'lee-tr/config.json';
  ```
- Constant configuration objects in `src/common/data/constant.ts` use uppercase keys:
  ```typescript
  export default {
    PREFIX: 'lee-tr',
    LIMIT_OF_TRANSLATE_KEYS: 25,
    DEFAULT_CONFIG_PATH: 'lee-tr/config.json',
    COMMAND: {
      CONFIG_FILE_PATH: '--filePath',
    },
    FORMAT: {
      SPACE: 2,
    },
    PAGINATION: {
      LIMIT: 20,
      CONCURRENT: 15,
    },
  };
  ```

---

## 5. Vocabulary & Spelling Standards

Ensure consistency in technical terms and avoid common typos across variables, function names, and user messages:

| Avoid / Typo Found | Standard Replacement | Notes |
| :--- | :--- | :--- |
| `exiting` | `existing` | Observed in: `"lang: ... is not exiting"` ➔ `"lang: ... does not exist"` |
| `spacial` | `special` | Observed in: `removeSpaceAndSpacialChar` ➔ `removeSpaceAndSpecialChar` |
| `stags`, `stag` | `stages`, `stage` | Observed in: `const stags: Array<TCheckStage>` ➔ `const stages` |
| `wen wrong` | `went wrong` | Observed in: `'Something wen wrong'` ➔ `'Something went wrong'` |
| `is already exist` | `already exists` | Observed in: `'language is already exist'` ➔ `'already exists'` |
