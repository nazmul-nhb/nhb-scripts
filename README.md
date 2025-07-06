# NHB Scripts

<!-- markdownlint-disable-file MD024 -->

<p>
  <a href="https://www.npmjs.com/package/nhb-scripts" aria-label="Downloads">
    <img src="https://img.shields.io/npm/dm/nhb-scripts.svg?label=DOWNLOADS&style=flat&color=red&logo=npm" alt="Downloads" />
  </a>
  <a href="https://www.npmjs.com/package/nhb-scripts" aria-label="Version">
    <img src="https://img.shields.io/npm/v/nhb-scripts.svg?label=NPM&style=flat&color=teal&logo=npm" alt="Latest Version" />
  </a>
  <a href="https://bundlephobia.com/result?p=nhb-scripts" aria-label="Bundle size">
    <img src="https://img.shields.io/bundlephobia/minzip/nhb-scripts?style=flat&color=purple&label=SIZE&logo=nodedotjs" alt="Bundle Size" />
  </a>
  <a href="https://www.npmjs.com/package/nhb-scripts" aria-label="License">
    <img src="https://img.shields.io/npm/l/nhb-scripts.svg?label=LICENSE&style=flat&color=orange&logo=open-source-initiative" alt="License" />
  </a>
</p>

## nhb-scripts

A **developer-first toolkit** to automate common dev tasks in JavaScript/TypeScript projects. Built to reduce repetitive boilerplate and improve developer velocity — no magic, just clean logic.

> Most scripts display a progress bar for the current task and automatically create a `.estimator` folder, which is also added to `.gitignore`.

---

## 🧰 Included CLI Scripts

| Script       | Description                                                                 |
| ------------ | --------------------------------------------------------------------------- |
| [nhb-module](#-nhb-module--module-generator) | Scaffold module (folder with files) (e.g., Express + Mongoose + Zod by default) with templates.  |
| [nhb-commit](#-nhb-commit--commit-version-updates-with-semver--custom-message) | Generate a conventional commit message interactively with validation.       |
| [nhb-format](#-nhb-format--code-formatter-prettier-runner) | Format code with `prettier`.       |
| [nhb-count](#-nhb-count--export-counter-cli) | Count export declarations (default, named, aliased) in JS/TS files/folders. |

> More Scripts Coming Soon...

<!-- > ✅ All scripts are available via **`pnpm` scripts** or as **binaries** (if installed globally). -->

> Most of the examples here are shown using `pnpm` as package manager, you can use other package managers like `npm` or `yarn` or others.

---

## 🔧 How to Use in Your Project

Add to your `devDependencies`:

```bash
yarn add -D nhb-scripts
```

```bash
pnpm add -D nhb-scripts
```

```bash
npm i -D nhb-scripts
```

Then in your `package.json`:

```json
{
  "scripts": {
    "module": "nhb-module",
    "commit": "nhb-commit",
    "format": "nhb-format",
    "count": "nhb-count"
  }
}
```

Now run any script like:

```bash
pnpm module      # 🧩 Generate a new module
pnpm commit      # ✅ Bump version & commit changes
pnpm format      # 🎨 Format code with prettier
pnpm count       # 📦 Count exports in files
```

Or without `package.json` setup:

```bash
pnpm nhb-module      # 🧩 Generate a new module
pnpm nhb-commit      # ✅ Bump version & commit changes
pnpm nhb-format      # 🎨 Format code with prettier
pnpm nhb-count       # 📦 Count exports in files
```

> Replace `pnpm` with `npm` or `yarn` if you're using those instead.

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

```bash
yarn module
```

```bash
npm run module
```

---

### 🛠️ What It Does

* Prompts for module name, destination, and template (unless passed as CLI flags).
* Uses a **default template** (`express-mongoose-zod`) or your **custom templates** via a config file.
* Prevents overwriting by default unless `--force` is passed or set in config.
* Allows lifecycle hooks: `onGenerate`, `onComplete`.
* Auto creates (if it is not created before) custom configuration file for template injection: `nhb.module.config.mjs`.

---

### 📦 Default Template

| Name                   | Description                                                            |
| ---------------------- | ---------------------------------------------------------------------- |
| `express-mongoose-zod` | Basic Express route + Mongoose model + Zod schema generator (built-in) |

---

### 📁 Custom Template Support

Create a `nhb.module.config.mjs` file in the project root:

```js
// @ts-check
import { defineModuleConfig } from 'nhb-scripts';

export default defineModuleConfig({
  destination: 'src/app/modules',  // default path if not overridden via CLI
  template: 'basic-app',           // optional default, it's not necessary as cli will prompt to choose from existing templates
  force: false,                    // disables overwrite unless true
  customTemplates: {
    // 🔁 Function-style: dynamic filenames or content
    'basic-app': {
      destination: 'src/app',
      files: (moduleName) => [
        {
          name: `${moduleName}.controller.ts`,
          content: `// controller for ${moduleName}`,
        },
        {
          name: `${moduleName}.service.ts`,
          content: `// service logic for ${moduleName}`,
        },
      ],
    },

    // 📦 Static-style: hardcoded files
    'admin-module': {
      files: [
        { name: 'controller.ts', content: '// controller' },
        { name: 'model.ts', content: '// mongoose model' },
      ],
    },
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

> The script will prompt you to create this config file automatically if missing.

#### 🧠 Why dynamic `files()`?

> If your filenames or content need to reference the module name (e.g. `auth.controller.ts`), use the function form.
> It provides full flexibility for templates that depend on runtime values.

#### 🗂️ Template Files (`files`)

You can provide either of the following:

1. **Static array of file entries**:

   ```js
   files: [
     { name: 'index.ts', content: '// content' },
     { name: 'routes.ts', content: 'export const route = "auth";' },
   ]
   ```

2. **Dynamic function (recommended for reusable templates)**:

   ```js
   files: (moduleName) => [
     { name: `${moduleName}.controller.ts`, content: `// controller for ${moduleName}` },
     { name: `${moduleName}.service.ts`, content: `// service for ${moduleName}` },
   ]
   ```

> 💡 **Note:** You can and should write actual code inside the `content` field using template strings — works with any language!
> 💡 **File names** (`name`) can include folders like `{ name: 'utils/helper.ts' }`. Folders will be auto-created if missing.
---

### 💡 CLI Flags

You can also generate modules non-interactively using CLI flags to streamline automation or scripting:

| Flag            | Alias | Description                                        |
| --------------- | ----- | -------------------------------------------------- |
| `--name`        | `-n`  | Name of the module                                 |
| `--template`    | `-t`  | Template to use (`express-mongoose-zod` or custom) |
| `--destination` | `-d`  | Directory to generate module into                  |
| `--force`       | `-f`  | Overwrite existing module if already present       |

Example:

```bash
# Using full flags
pnpm module --name=user --template=basic-app --destination=src/features --force

# Using full flags but without equal sign
pnpm module --name user --template basic-app --destination src/features --force

# Using aliases
pnpm module -n auth -t express-mongoose-zod -d src/app/modules

# Force overwrite if module exists
pnpm module -n blog -t express-mongoose-zod -d src/app/modules -f
```

---

### 🤖 What Happens Behind the Scenes

1. 🔍 Looks for a config file (offers to create one if missing).
2. 🧱 Asks for module name, template, and destination (or use flags).
3. ⚙️ Merges CLI flags with config values.
4. 🚧 Warns if module exists — prompts overwrite unless `--force`.
5. 🏗️ Generates module files from the selected template.
6. 🔁 Runs `onGenerate` and `onComplete` hooks if configured.

---

### 📁 Output Example

Given:

```js
// nhb.module.config.mjs
export default defineModuleConfig({
  destination: 'src/features',
  customTemplates: {
    'basic-app': {
      files: (name) => [
        { name: `${name}.ts`, content: `// module: ${name}` },
        { name: `${name}.routes.ts`, content: `// routes for ${name}` },
      ]
    },
  },
});
```

Run:

```bash
pnpm module -n user -t basic-app
```

**Result:**

```text
src/features/user/
├── user.ts           → // module: user
└── user.routes.ts    → // routes for user
```

---

### 🧩 Template Shape

```ts
type FileEntry = {
  name: string;       // file path relative to the module dir
  content: string;    // file contents
};

type CustomTemplate = {
  destination?: string;
  files: FileEntry[] | ((moduleName: string) => FileEntry[]);
};
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

```text
feat(api): add user registration flow
fix: resolve async deadlock issue
refactor(db): improve mongoose connection handling
```

---

### 🧩 Supported Types (Predefined Choices)

> Default type: **`update`**

| Type       | Description                   |
| ---------- | ----------------------------- |
| `update`   | General update (default)      |
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
| `Custom`   | ✍️ Manually enter your own    |

---

### 💬 Prompt Flow

```bash
? Current version: 1.3.4
? Enter new version (or press Enter to keep): 1.4.0
? Select commit type: Custom
? Enter custom commit type: infra
? Enter commit scope (optional): devops
? Enter commit message (required): configure docker build

✔ Commit message → infra(devops): configure docker build
✔ Version updated to 1.4.0
✔ Committed and pushed!
```

---

### 🧪 Semver Validations

* Prevents invalid semver input
* Ensures new version is **equal to or greater** than current
* Allows skipping version bump by pressing `Enter`

---

### 🔧 Behavior Summary

> **Note:** Git must be installed, and your repository must be initialized with a remote named `origin`.
This is required because the script **automatically commits and pushes** version changes to your Git remote.

| Step             | Behavior                                                                |
| ---------------- | ----------------------------------------------------------------------- |
| `version` prompt | Accepts semver (e.g., `1.2.3`, `2.0.0-beta.1`) or press `Enter` to skip |
| `type` prompt    | Choose from predefined types or default (`update`)                      |
| `scope` prompt   | Optional. If blank, excluded from final commit message                  |
| `message` prompt | Required. Validates non-empty                                           |
| `git` operations | Adds all changes, commits, pushes with composed message                 |

---

### ⚙️ `nhb.commit.config.mjs` — Optional Config File

You can optionally add a config file at the root of your project to extend the behavior of `nhb-commit`.

> Supported file names:
>
> * `nhb.commit.config.mjs`
> * `nhb.commit.config.js`

---

#### 🛠️ Example Config

```ts
// nhb.commit.config.mjs

// @ts-check

import { defineCommitConfig } from 'nhb-scripts';

export default defineCommitConfig({
 runFormatter: false
});
```

---

#### 📌 Available Options

| Option         | Type    | Default | Description                                                  |
| -------------- | ------- | ------- | ------------------------------------------------------------ |
| `runFormatter` | boolean | `false` | Whether to **automatically run Prettier** before committing. |

---

### ✨ Formatter Integration (Prettier)

If `runFormatter: true` is enabled in the config:

* It **ensures** `.prettierrc.json` and `.prettierignore` exist.
* It runs `prettier --write .` or customized options from `nhb.format.config.mjs` (if present) **before** staging changes.

> 💡 This ensures your code is always formatted before being committed!

---

### 📁 Optional Formatter Config File

You can also define a custom formatter config file.

Please refer to [nhb-format](#-nhb-format--code-formatter-prettier-runner) for details.

---

### 📦 Combined Flow

If both configs are present and `runFormatter` is `true`, `nhb-commit` will:

1. Load your `nhb.format.config.mjs` (if available).
2. Run Prettier formatting.
3. Proceed to version update and Git commit.

---

### ❌ Cancel or Abort

You can abort at any time using `Ctrl+C` or `Esc`.

---

## 🎨 `nhb-format` — Code Formatter (Prettier Runner)

A utility script that ensures clean and consistent formatting using **Prettier**, with optional config and auto-scaffolding support.

---

### ⚙️ Setup in `package.json`

```json
{
  "scripts": {
    "format": "nhb-format"
  }
}
```

Run it via:

```bash
pnpm format
```

---

### 📦 What It Does

1. Ensures `.prettierrc.json` and `.prettierignore` exist in the project root (auto-generates if missing).
2. Loads user config from:

   * `nhb.format.config.mjs` or
   * `nhb.format.config.js`
3. Executes Prettier with the defined args/files.

> 💡 If no config file exists, it runs Prettier with default args: `--write .`

---

### 🛠️ Example Config

Create a `nhb.format.config.mjs` file:

```js
// @ts-check

import { defineFormatConfig } from 'nhb-scripts';

export default defineFormatConfig({
 args: ['--write'],
 files: ['src',],
 ignorePath: '.prettierignore'
});
```

---

### 🔄 Automatic Integration with `nhb-commit`

If `runFormatter: true` is set in your `nhb.commit.config.mjs`, the formatter will be triggered **before committing**.
See [nhb-commit](#-nhb-commit--commit-version-updates-with-semver--custom-message) for more details.

---

### ⚠️ Requirements

Make sure `prettier` is installed in your `dependencies` or `devDependencies`:

```bash
pnpm add -D prettier
```

If missing, the script will exit with a warning and suggest installation.

---

### 📁 Output Example

```bash
pnpm format

🎨 Running Prettier...
✅ Prettier formatting complete!
```

Or if config is invalid/missing:

```bash
❌ Prettier not found. Please install `prettier`.
# install it using your favorite package manager. (npm/pnpm/yarn etc.)
```

---

## 📊 `nhb-count` — Export Counter CLI

Analyze the structure of JavaScript/TypeScript modules to detect and count:

* Default exports
* Named exports
* Aliased named exports
* Type-only named exports (`export type { ... }`)

> ⚠ Only supports files that use **ES-style exports** (`export`, `export default`). *CommonJS-style* (`module.exports`, `exports.foo`) is not currently counted.

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

[MIT](LICENSE) © [Nazmul Hassan](mailto:nazmulnhb@gmail.com)
