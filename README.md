# lee-tr-cli

<p align="center">
  <strong>Automate multi-language translations and locale synchronization in seconds.</strong><br>
  Built for modern web apps, CLI tools, and backend services. Supports <strong>TypeScript (ES Modules)</strong>, <strong>JSON</strong>, and <strong>CommonJS</strong>.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/lee-tr-cli"><img src="https://img.shields.io/npm/v/lee-tr-cli.svg?style=flat-square&color=blue" alt="npm version"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg?style=flat-square" alt="Node Version"></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/typescript-%5E5.9.0-blue.svg?style=flat-square" alt="TypeScript"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green.svg?style=flat-square" alt="License"></a>
</p>

---

## ⚡ Highlights

- **One-Command Setup**: Initialize your project localization in seconds with `lee-tr init`.
- **Translate from Clipboard**: Copy any phrase and run `lee-tr t <key>` to automatically translate and append to all target languages.
- **Smart Key Sync**: Run `lee-tr sync` to detect and translate only missing keys without overwriting existing translations.
- **Token Protection**: Preserves template interpolation variables like `{userName}`, `{{count}}`, and HTML tags without mangling.
- **Native TypeScript Support**: Seamlessly works with `export default` in `.ts` files, standard `.json`, or `module.exports` in `.js`.
- **Atomic Rollback**: Automatic snapshot backups prevent file corruption if network fails or process terminates.

---

## 📦 1. Installation

### Recommended: As a project devDependency
```bash
# Using npm
npm install -D lee-tr-cli

# Using pnpm
pnpm add -D lee-tr-cli

# Using yarn
yarn add -D lee-tr-cli
```

### Global Installation
```bash
npm install -g lee-tr-cli
```

> [!TIP]
> **Linux Users**: If you are using Linux (Wayland or X11) and want to use clipboard features with `lee-tr t`, ensure a clipboard provider is installed:
> ```bash
> sudo apt install wl-clipboard   # Wayland
> # OR
> sudo apt install xclip          # X11
> ```

---

## 🚀 2. Quick Start: From Zero to Integration

### Step 1: Initialize Localization
Run the interactive setup wizard in your project root:

```bash
npx lee-tr init
```

The wizard will prompt you:
1. **Format Type**: `module` (TypeScript `.ts`), `json`, or `commonjs` (`.js`)
2. **Directory**: e.g., `src/locales`
3. **Primary Language**: e.g., `en`
4. **Target Languages**: e.g., `km, ja, fr`

*(Or initialize non-interactively using flags)*:
```bash
npx lee-tr init --yes --type=module --localePath=src/locales --defaultLocale=en --locales=km,ja
```

This generates:
```text
your-project/
├── src/
│   └── locales/
│       ├── en.ts      # Primary reference locale (starter keys included)
│       ├── km.ts      # Target locale
│       └── ja.ts      # Target locale
└── lee-tr/
    └── config.json    # CLI configuration
```

---

### Step 2: Integrate into Your Application Code

#### A. In TypeScript / React / Next.js / Vite Projects (`type: "module"`)
Import and consume your locale files directly:

```typescript
// src/i18n.ts
import en from './locales/en';
import km from './locales/km';

export const resources = {
  en: { translation: en },
  km: { translation: km },
} as const;
```

#### B. In JSON / i18next Projects (`type: "json"`)
```typescript
import en from './locales/en.json';
import km from './locales/km.json';
```

---

### Step 3: Add Scripts to `package.json`

Add shortcuts to your `package.json` scripts for team collaboration:

```json
{
  "scripts": {
    "tr": "lee-tr t",
    "tr:sync": "lee-tr sync",
    "tr:dry": "lee-tr sync --dry-run",
    "tr:check": "lee-tr check"
  }
}
```

---

## 🛠️ 3. Daily Developer Workflows

### Workflow A: Add a Translation from Clipboard (`t`)
1. In your editor, highlight and copy a phrase to your clipboard:  
   *(e.g., `"Save and continue to payment"`)*
2. In your terminal, run:
   ```bash
   npx lee-tr t checkout.button.continue
   ```
3. `lee-tr` automatically:
   - Translates the clipboard text into all target languages (`km`, `ja`, etc.).
   - Converts `checkout.button.continue` into a nested object tree.
   - Deep-merges and updates all locale files on disk simultaneously!

*(If you don't pass a key, `lee-tr t` automatically generates a clean camelCase key from your phrase!)*

---

### Workflow B: Sync Missing Keys Across All Locales (`sync`)
When you add new feature keys directly to your primary language file (`en.ts`):

```typescript
// src/locales/en.ts
export default {
  dashboard: {
    welcome: "Welcome back, {userName}!",
    unread: "You have {{count}} unread notifications."
  }
}
```

Simply run:
```bash
# Preview what needs translating without saving
npx lee-tr sync --dry-run

# Translate and synchronize missing keys across all target files
npx lee-tr sync
```

- Target files (`km.ts`, `ja.ts`) will receive the newly translated keys automatically.
- Existing translations are preserved and never overwritten.
- Template variables (`{userName}`, `{{count}}`) remain untouched.

To sync only a specific language:
```bash
npx lee-tr sync km
```

---

### Workflow C: Expand to a New Market (`add`)
Need to support Spanish (`es`)?
```bash
npx lee-tr add es
```
`lee-tr` translates all keys from your default locale, writes `src/locales/es.ts`, and registers `es` in `lee-tr/config.json`.

---

### Workflow D: CI/CD Quality Checks (`check`)
Add a safety check in GitHub Actions or pre-commit hooks:
```bash
npx lee-tr check
```
Verifies that all physical files in `src/locales/` match the registered locales in `config.json`.

---

## ⚙️ 4. Configuration Reference

The configuration file is stored at `lee-tr/config.json`:

```json
{
  "type": "module",
  "defaultLocale": "en",
  "locales": [
    { "lang": "en", "file": "en.ts" },
    { "lang": "km", "file": "km.ts" },
    { "lang": "ja", "file": "ja.ts" }
  ],
  "localePath": "src/locales"
}
```

### Configuration Fields

| Field | Type | Description | Allowed Values |
| :--- | :--- | :--- | :--- |
| `type` | `string` | File format generated on disk. | `"module"` (`.ts`), `"json"` (`.json`), `"commonjs"` (`.js`) |
| `defaultLocale` | `string` | Source language code used for sync and clipboard translation. | Any valid code (e.g. `"en"`, `"fr"`, `"ja"`) |
| `locales` | `Array` | List of configured languages. Each item has `{ "lang": "...", "file": "..." }`. | Non-empty array |
| `localePath` | `string` | Directory path relative to project root where translation files live. | e.g. `"src/locales"`, `"locales"` |

### Custom Config Location
You can point to a custom configuration file in two ways:
1. **Via CLI flag**: `npx lee-tr sync --filePath=./custom-config.json`
2. **Via `package.json`**:
   ```json
   {
     "lee-tr": {
       "configPath": "./custom-config.json"
     }
   }
   ```

---

## 📋 5. CLI Commands Cheat Sheet

| Command | Description | Common Flags |
| :--- | :--- | :--- |
| `lee-tr init` | Setup wizard to create config and initial locale files | `--yes`, `--type=...`, `--locales=...`, `--force` |
| `lee-tr t [key]` | Translate clipboard content into all locales | `--filePath=...` |
| `lee-tr sync [target]` | Compare and sync missing keys from default locale | `--dry-run`, `--filePath=...` |
| `lee-tr add <locale>` | Translate full default locale into a brand-new language | `--filePath=...` |
| `lee-tr check` | Verify consistency between files on disk and config | `--filePath=...` |

---

## 📚 6. Documentation & Architecture

For in-depth developer guides, architectural diagrams, and API references, see our [`docs/`](./docs/README.md) directory:

- [**Coding Rules**](./docs/coding-rules.md): Coding guidelines, TypeScript strictness, async/sync rules.
- [**Naming Conventions**](./docs/naming-conventions.md): File, function, and variable standards.
- [**Coding Style & Formatting**](./docs/coding-style.md): Prettier config, import organization.
- [**Reusable Functions Catalog**](./docs/reusable-functions.md): Full reference of all internal helper methods.
- [**Architecture & Commands**](./docs/architecture-and-commands.md): CLI workflows and lifecycle safety.
- [**Code Audit & Quality Findings**](./docs/code-audit-and-improvements.md): Audit findings, bug resolutions, and quality reports.

---

## 🤝 Contributing & Issues

Found a bug or have a feature request? Please open an issue on GitHub:  
👉 **https://github.com/sunleehuor/lee-tr-cli**

Licensed under the [MIT License](LICENSE).
