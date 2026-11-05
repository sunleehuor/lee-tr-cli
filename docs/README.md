# lee-tr-cli Documentation

Welcome to the internal engineering documentation for **lee-tr-cli**, a TypeScript-based Command Line Interface (CLI) built on Node.js to automate key translation, localization management, and multi-language file synchronization.

---

## 📚 Documentation Index

| Document | Description |
| :--- | :--- |
| [**Coding Rules**](./coding-rules.md) | Architectural rules, TypeScript guidelines, error handling, async/await standards, and process lifecycle |
| [**Naming Conventions**](./naming-conventions.md) | Rules and conventions for files, directories, functions, types, interfaces, constants, and variables |
| [**Coding Style & Formatting**](./coding-style.md) | Formatting standards, Prettier rules, import ordering, and syntax guidelines |
| [**Reusable Functions Catalog**](./reusable-functions.md) | Comprehensive API catalog of all helper utilities in `src/common/helper/*` with signatures and usage examples |
| [**Architecture & Commands**](./architecture-and-commands.md) | System architecture, execution workflow, configuration structure, and command lifecycle (`t`, `add`, `check`) |
| [**Code Audit & Quality Findings**](./code-audit-and-improvements.md) | Detailed code review findings, detected bugs, spelling inconsistencies, and recommended improvements |

---

## 🚀 Quick Overview

- **Runtime**: Node.js (`^20.*`)
- **Language**: TypeScript (`^5.9.3`) targeting `ES2020` / `CommonJS`
- **Primary Dependencies**:
  - `bing-translate-api` (Translation backend)
  - `clipboardy` (Clipboard read/write automation)
- **Supported Formats**:
  - JSON (`.json`)
  - ES Modules (`export default { ... }` in `.ts`)
  - CommonJS (`module.exports = { ... }` in `.js`)

---

## 📁 Source Directory Map

```text
src/
├── bin/
│   └── lee-tr.ts                     # CLI entrypoint, argument parsing, config validation & dispatch
├── command/
│   ├── t.ts                          # Main translation command ('lee-tr t [keys]')
│   ├── add.ts                        # Add language command ('lee-tr add [locale]')
│   └── check.ts                      # Integrity checking command ('lee-tr check')
└── common/
    ├── data/
    │   ├── constant.ts               # Global constants (pagination, limits, defaults)
    │   ├── sample/                   # Template files for initialized language files
    │   │   ├── defaultCommon.ts      # CommonJS template
    │   │   ├── defaultJson.json      # JSON template
    │   │   └── defaultModule.ts      # ES Module template
    │   └── types/                    # TypeScript interfaces & types
    │       ├── check.ts              # Check stage types
    │       ├── config.ts             # Configuration interfaces (IConfig, IPackageJson)
    │       └── lang.ts               # Supported LANGUAGE_CODES and LanguageCode type
    └── helper/                       # Reusable utility functions
        ├── add.ts                    # Object flattening, unflattening, chunking & path setting
        ├── command.ts                # CLI argument parsing utilities
        ├── common.ts                 # String normalization, deepMerge, nested objects, rollback
        ├── file.ts                   # File read, write, existence, sample loading
        ├── inject.ts                 # Dynamic dependency loaders (clipboardy)
        ├── logger.ts                 # Formatted console logging (info, error, warning)
        └── translate.ts              # Translation wrapper around bing-translate-api
```
