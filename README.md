# NHB Scripts

<!-- markdownlint-disable-file MD024 -->

## nhb-scripts

A **developer-first toolkit** to automate common dev tasks in JavaScript / TypeScript monorepos or backend-focused apps. Built to reduce repetitive boilerplate and improve developer velocity — no magic, just clean logic.

---

## 🧰 Included CLI Scripts

| Script       | Description                                                                 |
| ------------ | --------------------------------------------------------------------------- |
| `nhb-module` | Scaffold a backend module (e.g., Express + Mongoose + Zod) with templates.  |
| `nhb-commit` | Generate a conventional commit message interactively with validation.       |
| `nhb-count`  | Count export declarations (default, named, aliased) in JS/TS files/folders. |

> ✅ All scripts are available via **`pnpm` scripts** or as **binaries** (if installed globally).

---

## 🔧 How to Use in Your Project

Add to your `devDependencies`:

```bash
pnpm add -D nhb-scripts
```

Then in your `package.json`:

```jsonc
{
  "scripts": {
    "module": "nhb-module",
    "commit": "nhb-commit",
    "count": "nhb-count"
  }
}
```

Now run any script like:

```bash
pnpm module
pnpm commit
pnpm count
```

---

## 🧱 `nhb-module` — Module Generator

Scaffold consistent, production-ready API modules in your codebase using prebuilt or custom-defined templates.

This CLI simplifies creating module directories and boilerplate files with optional configuration, hooks, and folder override logic.

---

### ⚙️ Setup in `package.json`

```json
{
  "scripts": {
    "module": "nhb-module"
  }
}
```

Use via:

```bash
pnpm module
```

---

### 🛠️ What It Does

* Prompts for module name, destination, and template (unless passed as CLI flags).
* Uses a **default template** (`express-mongoose-zod`) or your **custom templates** via a config file.
* Prevents overwriting by default unless `--force` is passed or set in config.
* Allows lifecycle hooks: `onGenerate`, `onComplete`.

---

### 📦 Default Template

| Name                   | Description                                                            |
| ---------------------- | ---------------------------------------------------------------------- |
| `express-mongoose-zod` | Basic Express route + Mongoose model + Zod schema generator (built-in) |

---

### 📁 Custom Template Support

Create a `nhb.module.config.mjs` file in the project root:

```ts
// @ts-check
import { defineModuleConfig } from 'nhb-scripts';

export default defineModuleConfig({
  destination: 'src/app/modules',  // default location
  template: 'my-template1',        // optional default
  force: false,                    // global force setting

  customTemplates: {
    'my-template1': {
      destination: 'src/features',
      files: [
        { name: 'index.ts', content: '// index content' },
        { name: 'router.ts', content: '// Express router' },
      ],
    },
    'admin-module': {
      files: [
        { name: 'controller.ts', content: '// controller code' },
        { name: 'model.ts', content: '// mongoose model' },
      ],
    }
  },

  hooks: {
    onGenerate(name) {
      console.log('🚀 Generating module:', name);
    },
    onComplete(name) {
      console.log('🎉 Finished:', name);
    }
  }
});
```

The script will prompt you to create this config file automatically if missing.

---

### 💡 CLI Flags

| Flag            | Alias | Description                                        |
| --------------- | ----- | -------------------------------------------------- |
| `--name`        | `-n`  | Name of the module                                 |
| `--template`    | `-t`  | Template to use (`express-mongoose-zod` or custom) |
| `--destination` | `-d`  | Directory to generate module into                  |
| `--force`       | `-f`  | Overwrite existing module if already present       |

Example:

```bash
pnpm module --name=user --template=my-template1 --destination=src/features
```

---

### 🤖 Behavior Breakdown

1. **Check config file**: If none is found, offer to scaffold one.
2. **Prompt for module name**, template (custom or built-in), and destination.
3. **Load and merge config** (file + CLI).
4. **Check for existence** and prompt overwrite unless `--force` is passed.
5. **Generate files** based on selected template.
6. **Trigger lifecycle hooks** if defined.

---

### 📁 Output Example

Given:

```ts
// config file
{
  "template": "my-template1",
  "destination": "src/features",
  "files": [
    { name: "index.ts", content: "// index" },
    { name: "router.ts", content: "// routes" }
  ]
}
```

Result:

``` bash
src/features/user/
├── index.ts     → // index
└── router.ts    → // routes
```

---

### 🧩 Template Definition (Custom)

Each custom template consists of:

```ts
{
  destination?: string;
  files: Array<{ name: string; content: string }>;
}
```

You can define multiple templates and dynamically select one at CLI prompt or via `--template`.

---

### 🔄 Lifecycle Hooks (Optional)

| Hook         | Signature                      | Purpose                     |
| ------------ | ------------------------------ | --------------------------- |
| `onGenerate` | `(moduleName: string) => void` | Before writing module files |
| `onComplete` | `(moduleName: string) => void` | After writing module files  |

---

### ❌ Cancel or Abort

* If a module already exists and `--force` is not used, the CLI prompts confirmation.
* You can abort at any step via keyboard interrupt (`Ctrl+C` or `Esc` on prompts).

---

## 📝 `nhb-commit` — Commit Version Updates with Semver & Custom Message

A simple, interactive CLI to:

* Safely bump the package version (`package.json`)
* Add a **typed Git commit message** (with optional scope)
* Automatically commit and push

This ensures your version bumps and commit messages are semver-valid, consistent, and expressive.

---

### ⚙️ Setup in `package.json`

```json
{
  "scripts": {
    "commit": "nhb-commit"
  }
}
```

Use via:

```bash
pnpm commit
```

---

### 🚦 What It Does

1. Prompts for **new version** (or skip to use the current).
2. Prompts for a **commit type** (e.g., `feat`, `fix`, `refactor`, etc.).
3. Prompts optionally for a **scope** (e.g., `auth`, `ui`, etc.).
4. Requires a **commit message**.
5. Updates `package.json` version.
6. Runs:

   ```bash
   git add .
   git commit -m "<type>(<scope>): <message>"
   git push
   ```

---

### ✨ Commit Format

```bash
<type>(optional-scope): <message>
```

Examples:

```bash
feat(api): add user registration flow
fix: resolve async deadlock issue
refactor(db): improve mongoose connection handling
```

---

### 🧩 Supported Types (Predefined Choices)

> Default type: **`update`**

| Type       | Description                   |
| ---------- | ----------------------------- |
| `feat`     | New feature                   |
| `fix`      | Bug fix                       |
| `chore`    | Maintenance task (e.g., deps) |
| `refactor` | Internal logic change         |
| `test`     | Adding/fixing tests           |
| `docs`     | Documentation-only change     |
| `style`    | Code formatting, whitespace   |
| `perf`     | Performance improvement       |
| `ci`       | CI-related changes            |
| `build`    | Build system changes          |
| `revert`   | Revert a previous commit      |
| `update`   | General update (default)      |

---

### 💬 Prompt Flow

```bash
? Current version: 1.3.4
? Enter new version (or press Enter to keep): 1.4.0
? Select commit type: feat
? Enter commit scope (optional): api
? Enter commit message (required): add login endpoint

✔ Commit message → feat(api): add login endpoint
✔ Version updated to 1.4.0
✔ Committed and pushed!
```

---

### 🧪 Semver Validations

* Prevents invalid semver input
* Ensures new version is **equal to or greater** than current
* Allows skipping version bump by pressing Enter

---

### 🔧 Behavior Summary

| Step             | Behavior                                                              |
| ---------------- | --------------------------------------------------------------------- |
| `version` prompt | Accepts semver (e.g., `1.2.3`, `2.0.0-beta.1`) or press Enter to skip |
| `type` prompt    | Choose from predefined types or default (`update`)                    |
| `scope` prompt   | Optional. If blank, excluded from final commit message                |
| `message` prompt | Required. Validates non-empty                                         |
| `git` operations | Adds all changes, commits, pushes with composed message               |

---

### ❌ Cancel or Abort

You can abort at any time using `Ctrl+C` or `Esc`.

---

## 📊 `nhb-count` — Export Counter CLI

Analyze the structure of JavaScript / TypeScript modules to detect and count:

* Default exports
* Named exports
* Aliased named exports
* Type-only named exports (`export type { ... }`)

---

### 🔧 Usage

```bash
pnpm count
```

> **Note:** This must be configured in your `package.json` scripts:

 ```json
 {
   "scripts": {
     "count": "nhb-count"
   }
 }
 ```

---

### 🧭 Interactive CLI Prompts

When executed, the script will prompt you:

```bash
🎯 Please specify the path to a "JavaScript/TypeScript/MJS" file or folder.

   - Enter a file path to process a specific file.
   - Enter a folder path to scan all .js, .ts, or .mjs files recursively.
   - Leave it empty to scan the default file: src/index.ts.
```

---

### 📂 Folder Scan Behavior

* If a **folder** is entered, all `.ts`, `.js`, and `.mjs` files inside are scanned recursively.
* If a **file** is entered, only that file is analyzed.
* If **nothing is entered**, the script defaults to `src/index.ts`.

---

### 📤 Output Format

Each file's result is logged like this:

```bash
📦 Export Summary for "src/utils/math.ts":
🔸 Default Exports        : 1
🔹 Named Exports (Total)  : 5
   ┣ Direct               : 3
   ┗ Aliased              : 2
🔺 Total Type Exports     : 4
```

---

### 📌 What It Detects

| Count Type            | Description                                                        |
| --------------------- | ------------------------------------------------------------------ |
| `default`             | Number of `export default` statements                              |
| `namedExportsTotal`   | Total `export { x, y as z }` style exports, including aliased ones |
| `namedExportsDirect`  | Named exports without aliases (e.g., `export { foo }`)             |
| `namedExportsAliased` | Named exports using `as` keyword (e.g., `export { foo as bar }`)   |
| `namedTypeExports`    | Type-only exports (e.g., `export type { MyType }`)                 |

---

### ✅ Example

Given this file:

```ts
export default function main() {}
export const foo = 42;
export { bar as renamedBar };
export type { SomeType };
```

Output:

```bash
📦 Export Summary for "some/file.ts":
🔸 Default Exports        : 1
🔹 Named Exports (Total)  : 2
   ┣ Direct               : 1
   ┗ Aliased              : 1
🔺 Total Type Exports     : 1
```

---

## 📄 License

MIT © [Nazmul Hassan](mailto:nazmulnhb@gmail.com)
