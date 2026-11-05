# Coding Style & Formatting Guidelines

This document details the code formatting rules, syntactic preferences, and import patterns enforced in `lee-tr-cli`.

---

## 1. Prettier Configuration

The repository uses Prettier for automated code formatting. The project settings in `.prettierrc` are:

```json
{
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "printWidth": 120
}
```

### Key Style Rules:
- **Indent**: Exactly 2 spaces (no tab characters).
- **Quotes**: Single quotes (`'example'`) for string literals in TypeScript files.
- **Semicolons**: Always terminate statements with semicolons (`semi: true`).
- **Trailing Commas**: Use ES5 trailing commas for objects and arrays spanning multiple lines.
- **Bracket Spacing**: Always include spaces inside object literals: `{ key: value }`, not `{key: value}`.
- **Line Length**: Max 120 characters before wrapping.

---

## 2. Import Organization & Hierarchy

Keep imports organized into clear groups separated by a blank line:

1. **Node.js Core Modules**: `path`, `fs`, `os`, etc.
2. **Third-Party Libraries**: `bing-translate-api`, `clipboardy`, etc.
3. **Internal Types**: Interfaces and types from `../common/data/types/*`
4. **Internal Constants / Data**: Constants and sample definitions from `../common/data/*`
5. **Internal Helpers / Utilities**: Methods from `../common/helper/*`
6. **Commands / Higher-level modules**: `../command/*`

### Example:
```typescript
// 1. Node Core
import os from 'os';
import path from 'path';

// 2. Third-Party
import { translate } from 'bing-translate-api';

// 3. Types
import { IConfig } from '../common/data/types/config';
import { LanguageCode } from '../common/data/types/lang';

// 4. Data / Constants
import constant from '../common/data/constant';

// 5. Helpers
import { isFileExisting, writeFile } from '../common/helper/file';
import { logger, loggerError } from '../common/helper/logger';
import { getTranslate } from '../common/helper/translate';
```

> [!CAUTION]
> **No Mixed Imports**: Do not mix `require()` statements alongside ES6 `import` statements in `.ts` files (e.g., `const sampleDefaultCommon = require(...)`). Always use `import` syntax or `import()` dynamic expressions.

---

## 3. TypeScript Idioms & Syntax

### Avoid Zombie / Commented-out Code
Remove inactive or dead debug comments before committing code (e.g., commented-out `cleanup` or `console.log` lines):
```typescript
// ❌ Discouraged:
process.on('exit', (code) => {
  // cleanup(`exit:${code}`);
});

// ✅ Preferred: Remove if not needed or provide reasoning.
```

### Safe Navigation & Optional Chaining
Use optional chaining (`?.`) and nullish coalescing (`??`) appropriately:
```typescript
const cleanKeys = removeSpaceAndSpecialChar(defaultKeys?.trim() ?? '') || objectKey(await clipboardy.read());
```

### JSDoc for Exported Utilities
Document reusable helper methods with JSDoc headers specifying arguments, return types, and exceptions:

```typescript
/**
 * Splits an array into smaller chunks of a specified size.
 *
 * @template T
 * @param {T[]} arr - The source array to chunk.
 * @param {number} size - Maximum size of each chunk.
 * @returns {T[][]} An array of array slices.
 */
export function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
```

---

## 4. Console & Output Formatting Standards

All console messaging is standardized in `src/common/helper/logger.ts`:

- **Information Logs**: Prefixed with `=====> ` (e.g. `logger('Translate completed');`)
- **Error Logs**: Prefixed with `🛑 ` (e.g. `loggerError('Translation failed.');`)
- **Warning Logs**: Prefixed with `⚠️ ` (e.g. `loggerWarning('Key already exists in target.');`)

Do not introduce ad-hoc console formats or raw `console.log` statements in command workflows.
