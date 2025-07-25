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

A **developer-first toolkit** to automate common dev tasks in JavaScript/TypeScript projects. Built to reduce repetitive boilerplate and improve developer velocity — no magic, just clean logic.

> Most scripts display a progress bar for the current task and automatically create a `.estimator` folder, which is also added to `.gitignore`.

## ⚡ Compatibility

<img src="https://img.shields.io/badge/Node.js-Version%2022+-teal?style=flat&logo=node.js&logoColor=green" alt="Node.js 22+" />

> **Important:**  
> `nhb-scripts` is designed **only for Node.js environments** (v22 or later).  
> It is **not intended for browser environment**, so tools like [Bundlephobia](https://bundlephobia.com/) may report missing browser dependencies.  
> This is expected behavior and does **not** affect usage in `Node.js`.

### ✅ Requirements

- Node.js **22 or newer**  
- `npm`, `pnpm`, or `yarn` for installation

```bash
pnpm add -D nhb-scripts
# or
npm install -D nhb-scripts
# or
yarn add -D nhb-scripts
```

---

## Unified Configuration System

All scripts use a single configuration file `nhb.scripts.config.mjs` that is automatically created if not present. The default configuration and other available (noted if not default) options include:

```js
// @ts-check

import { defineScriptConfig, expressMongooseZodTemplate } from 'nhb-scripts';

export default defineScriptConfig({
    format: {
        args: ['--write'],
        files: ['.'],
        ignorePath: '.prettierignore',
    },
    lint: { folders: ['src'], patterns: ['**/*.ts'] }, // Optional, these are defaults
    fix: { folders: ['src'], patterns: ['**/*.ts'] }, // Optional, these are defaults
    commit: {
        runFormatter: false, // do not run formatter,  use `true` to format before committing 
    },
    count: {
        defaultPath: '.', // default path to scan
        excludePaths: ['node_modules', 'dist', 'build'] // folders to exclude
    },
    build: {
      distFolder: 'dist', // optional, default: "dist"
      deleteDist: true, // delete dist folder before each build, set `false` to keep dist folder intact
      commands: [ // default is [{cmd: 'tsc'}]
        // Not default
          { cmd: 'tsc', args: ['-p', 'tsconfig.cjs.json'] },
        // Not default
          {
              cmd: 'tsc',
              args: ['-p', 'tsconfig.esm.json'],
              options: { stdio: 'inherit' }
          }
      ],
      after: [
        // Not default
          async () => await fixJsExtensions('dist/esm'),
        // Not default
          async () => await fixTypeExports({
              distPath: 'dist/dts',
              packageJsonPath: 'package.json',
              typeFileCandidates: ['types.d.ts', 'interfaces.d.ts'],
              extraPatterns: [
                  { pattern: 'plugins', folderName: 'plugins' },
              ],
              extraStatic: {
                  './types': {
                      types: './dist/dts/types/index.d.ts',
                      default: './dist/dts/types/index.d.ts'
                  },
                  './constants': {
                      types: './dist/dts/constants.d.ts',
                      import: './dist/esm/constants.js',
                      require: './dist/cjs/constants.js'
                  },
              }
          }),
      ],
    },
    module: {
        destination: 'src/modules', // optional, default: "src/modules"
        defaultTemplate: 'my.template1', // selected by default, must match with the keys of `templates` object
        force: false, // `true` if you want to override the existing module
        templates: {
            'express-mongoose-zod': {
                createFolder: true,
                destination: 'src/app/modules',
                files: expressMongooseZodTemplate // pre-built module : function that receives moduleName as argument and creates pre-defined files and contents
            },
            'my.template1': {
                createFolder: true, // if `false` does not create folder with the module name from cli
                destination: 'src/app', // optional, will prioritize inputs from cli
                // Use dynamic moduleName in filenames and contents
                files: (moduleName) => [
                    { name: `${moduleName}.controllers.ts`, content: `// controllers for ${moduleName}` },
                    { name: `${moduleName}.services.ts`, content: `// services for ${moduleName}` }
                ]
            },
            'my_template2': {
                destination: 'src/features', // optional, will prioritize inputs from cli
                // Use static file list with contents
                files: [
                    { name: 'index.ts', content: '// content' },
                    { name: 'dummy.js', content: '// dummy' }
                ]
            },
        },
        // Optional hooks to inspect or execute something at the beginning or after the module generation
        hooks: {
            onGenerate(name) {
                console.log('➡️  Generating:', name);
            },
            onComplete(name) {
                console.log('✅ Complete:', name);
            }
        }
    }
});
```

---

## 🧰 Included CLI Scripts

| Script       | Description                                                                 |
| ------------ | --------------------------------------------------------------------------- |
| [nhb-module](#-nhb-module--module-generator) | Scaffold module (folder with files) (e.g., Express + Mongoose + Zod by default) with templates.  |
| [nhb-build](#️-nhb-build--customizable-build-runner-with-progress-visualization) |  Customizable Build Runner with Progress Visualization.  |
| [nhb-commit](#-nhb-commit--commit-version-updates-with-semver--custom-message) | Generate a conventional commit message interactively with validation.       |
| [nhb-format](#-nhb-format--code-formatter-prettier-runner) | Format code with `prettier`.       |
| [nhb-lint](#-nhb-lint--eslint-linter-runner) | Lint code with `eslint`.                         |
| [nhb-fix](#-nhb-fix--eslint-autofix-runner) | Fix linting errors in code with `eslint`.       |
| [nhb-count](#-nhb-count--export-counter-cli) | Count export declarations (default, named, aliased) in JS/TS files/folders. |
| [nhb-delete](#-nhb-delete--interactive-file--folder-remover) | Interactive File(s)/Folder(s) Remover. |

> More Scripts Coming Soon...

<!-- > ✅ All scripts are available via **`pnpm/npm/yarn` scripts** or as **binaries** (if installed globally). -->

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

> Replace `pnpm` with `npm run` or `yarn` if you're using those instead.

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

- Prompts for module name, destination, and template (unless passed as CLI flags).
- Uses a **pre-built template** (`express-mongoose-zod` : imported function `expressMongooseZodTemplate`) or your **custom templates** via a config file.
- Prevents overwriting by default unless `--force` is passed or set in config.
- Allows lifecycle hooks: `onGenerate`, `onComplete`.

---

### 📦 Pre-built Template

| Name                   | Description                                                            |
| ---------------------- | ---------------------------------------------------------------------- |
| `express-mongoose-zod` | Basic Express route + Mongoose model + Zod schema generator (built-in : imported function `expressMongooseZodTemplate`) |

---

### 📁 Custom Template Support

Configure templates in `nhb.scripts.config.mjs`:

```js
module: {
    destination: 'src/modules', // optional, default: "src/modules"
    defaultTemplate: 'my.template1', // selected by default, must match with the keys of `templates` object
    force: false, // `true` if you want to override the existing module
    templates: {
        'express-mongoose-zod': {
            createFolder: true,
            destination: 'src/app/modules',
            files: expressMongooseZodTemplate // pre-built module : function that receives moduleName as argument and creates pre-defined files and contents
        },
        'my.template1': {
            createFolder: true, // if `false` does not create folder with the module name from cli
            destination: 'src/app', // optional, will prioritize inputs from cli
            // Use dynamic moduleName in filenames and contents
            files: (moduleName) => [
                { name: `${moduleName}.controllers.ts`, content: `// controllers for ${moduleName}` },
                { name: `${moduleName}.services.ts`, content: `// services for ${moduleName}` }
            ]
        },
        'my_template2': {
            destination: 'src/features', // optional, will prioritize inputs from cli
            // Use static file list with contents
            files: [
                { name: 'index.ts', content: '// content' },
                { name: 'dummy.js', content: '// dummy' }
            ]
        },
    },
    // Optional hooks to inspect or execute something at the beginning or after the module generation
    hooks: {
        onGenerate(name) {
            console.log('➡️  Generating:', name);
        },
        onComplete(name) {
            console.log('✅ Complete:', name);
        }
    }
}
```

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

| Flag             | Alias | Description                                        |
| ---------------- | ----- | -------------------------------------------------- |
| `--name`         | `-n`  | Name of the module                                 |
| `--template`     | `-t`  | Template to use                                    |
| `--destination`  | `-d`  | Directory to generate module into                  |
| `--force`        | `-f`  | Overwrite existing module if already present       |
| `--create-folder`| `-cf` | Create folder for module (default: `true`)         |

Example:

```bash
# Using full flags
pnpm module --name=user --template=basic-app --destination=src/features --force

# Using full flags but without equal sign
pnpm module --name user --template basic-app --destination src/features --force

# Using aliases
pnpm module -n auth -t express-mongoose-zod -d src/modules

# Force overwrite if module exists
pnpm module -n blog -t express-mongoose-zod -d src/modules -f

# With create folder flag
pnpm module --name=user --template=basic-app --destination=src/features --force --create-folder=false

# Using aliases
pnpm module -n auth -t express-mongoose-zod -d src/modules -cf false
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
module: {
    destination: 'src/features',
    customTemplates: {
        'basic-app': {
            files: (name) => [
                { name: `${name}.ts`, content: `// module: ${name}` },
                { name: `${name}.routes.ts`, content: `// routes for ${name}` }
            ]
        }
    }
}
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

### 🛑 Cancel or Abort

- If a module already exists and `--force` is not used, the CLI prompts confirmation.
- You can abort at any step via keyboard interrupt (`Ctrl+C` or `Esc` on prompts).

---

## 🏗️ `nhb-build` — Customizable Build Runner with Progress Visualization

A configurable build runner with progress estimator that can execute your build commands in sequence (e.g., `tsc`, `rollup`, `vite`) and then run optional post‑build hooks like `fixTypeExports()` or `fixJsExtensions()`.

### ✨ Features

- ✅ Define any build commands in your `nhb.scripts.config.mjs` (defaults to `tsc`).
- ✅ Dynamically add multiple commands with arguments and `execa` options.
- ✅ Always cleans your specified dist folder (using `rimraf`) before each build to avoid conflicts. You can configure this behavior.
- ✅ Run post‑build hooks (`after`) as an array of async functions (e.g., `fixJsExtensions('dist/esm')`).
- ✅ Rich output: shows file sizes, count, and total build time.

---

### ⚙️ Configuration

Add a `build` section in your `nhb.scripts.config.mjs`:

```js
// @ts-check
import { defineScriptConfig, fixJsExtensions, fixTypeExports} from 'nhb-scripts';

export default defineScriptConfig({
  // Other configs...
  build: {
    distFolder: 'output', // optional, default: "dist"
    deleteDist: true, // delete dist folder before each build, set `false` to keep dist folder intact
    commands: [
      { cmd: 'tsc', args: ['-p', 'tsconfig.cjs.json'] },
      { cmd: 'tsc', args: ['-p', 'tsconfig.esm.json'], options: { stdio: 'inherit' } }
    ],
    after: [
        async () => await fixJsExtensions('dist/esm'),
        async () => await fixTypeExports({
            distPath: 'dist/dts',
            packageJsonPath: 'package.json',
            typeFileCandidates: ['types.d.ts', 'interfaces.d.ts'],
            extraPatterns: [
                { pattern: 'plugins', folderName: 'plugins' },
            ],
            extraStatic: {
                './types': {
                    types: './dist/dts/types/index.d.ts',
                    default: './dist/dts/types/index.d.ts'
                },
                './constants': {
                    types: './dist/dts/constants.d.ts',
                    import: './dist/esm/constants.js',
                    require: './dist/cjs/constants.js'
                },
            }
        }),
    ],
  }
});
```

#### 🏗️ **Options**

| Field        | Type                   | Default   | Description                                                 |
| ------------ | ---------------------- | --------- | ----------------------------------------------------------- |
| `distFolder` | `string`               | `dist`    | Output folder used for size reporting and cleanup.          |
| `commands`   | `Array<BuildCommand>`  | see below | Array of build commands.                                    |
| `after`      | `Array<Promise<void>>` | `[]`      | Post‑build hooks to run sequentially after commands finish. |

**`BuildCommand` shape:**

```ts
{
  cmd: string;           // executable to run (e.g. "tsc", "rimraf")
  args?: string[];       // arguments for the command
  options?: import('execa').Options; // additional execa options
}
```

---

### 📦 Usage

Add to `package.json`:

```json
{
  "scripts": {
    "build": "nhb-build"
  }
}
```

Then run:

```bash
pnpm build
# or
npm run build
# or
yarn build
```

---

### ✅ Example Output

```bash
📦 Build Your Application
─────────────────────────────────────────────
Building...

✓ Transformed Files:
🟨 dist/esm/index.js                              3.20 kB
🟦 dist/dts/index.d.ts                            0.45 kB
🟩 dist/esm/index.js.map                          1.15 kB
...
✓ Total Files: 25; Total Size: 89.42 kB
📦 Application was built in 3.27 seconds!
```

---

### 🔧 Post‑Build Hooks

`after` hooks run **after all build commands succeed**, in order.
You can pass any async function returning a Promise, for example:

```js
// @ts-check

import { fixJsExtensions, fixTypeExports} from 'nhb-scripts';

export default defineScriptConfig({
  build: {
    after: [
        async () => await fixJsExtensions('dist/esm'),
        async () => await fixTypeExports({
            distPath: 'dist/dts',
            packageJsonPath: 'package.json',
            typeFileCandidates: ['types.d.ts', 'interfaces.d.ts'],
            extraPatterns: [
                { pattern: 'plugins', folderName: 'plugins' },
            ],
            extraStatic: {
                './types': {
                    types: './dist/dts/types/index.d.ts',
                    default: './dist/dts/types/index.d.ts'
                },
                './constants': {
                    types: './dist/dts/constants.d.ts',
                    import: './dist/esm/constants.js',
                    require: './dist/cjs/constants.js'
                },
            }
        }),
    ],
  }
});
```

---

> ✨ **Tip:** Because `nhb-build` uses `execa`, all commands respect your local environment and `cwd`, so you can run any build tools your project needs.

---

## 📝 `nhb-commit` — Commit Version Updates with Semver & Custom Message

A simple, interactive CLI to:

- Safely bump the package version (`package.json`)
- Add a **conventional typed Git commit message** (with optional scope)
- Automatically commit and push

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

| Type       |     Description                   |
| ---------- | --------------------------------- |
| `update`   | 🔧  General update (default)      |
| `feat`     | ✨  New feature                   |
| `fix`      | 🐛  Bug fix                       |
| `chore`    | 🛠️  Maintenance task (e.g., deps) |
| `refactor` | 🧼  Internal logic change         |
| `test`     | 🧪  Adding/fixing tests           |
| `docs`     | 📚  Documentation-only change     |
| `style`    | 💅  Code formatting, styling etc. |
| `perf`     | ⚡  Performance improvement       |
| `ci`       | 🚀  CI-related changes            |
| `build`    | 🧱  Build system changes          |
| `revert`   | 🔁  Revert a previous commit      |
| `release`  | 🔖  Version bump or release       |
| `deps`     | 📦  Dependency updates            |
| `cleanup`  | 🧹  Minor cleanup tasks           |
| `merge`    | 🧭  Merge-related commits         |
| `Custom`   | ✍️  Manually enter your own       |

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

- Prevents invalid semver input
- Ensures new version is **equal to or greater** than current
- Allows skipping version bump by pressing `Enter`

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

### Configuration

In `nhb.scripts.config.mjs`:

```js
commit: {
    runFormatter: false // set true to run Prettier before committing
}
```

---

#### 📌 Available Options

| Option         | Type    | Default | Description                                                  |
| -------------- | ------- | ------- | ------------------------------------------------------------ |
| `runFormatter` | boolean | `false` | Whether to **automatically run Prettier** before committing. |

---

### ✨ Formatter Integration (Prettier)

If `runFormatter: true` is enabled in the config:

- It **ensures** `.prettierrc.json` and `.prettierignore` exist.
- It runs `prettier --write .` or customized options from `nhb.format.config.mjs` (if present) **before** staging changes.

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

### 🛑 Cancel or Abort

You can abort at any time using `Ctrl+C` or `Esc`.

---

## 🎨 `nhb-format` — Code Formatter (Prettier Runner)

A script that ensures clean and consistent formatting using **Prettier**, with optional config and auto-scaffolding support.

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

   - `nhb.scripts.config.mjs` or
   - `nhb.scripts.config.js`
3. Executes Prettier with the defined args/files.

> 💡 If no config file exists, it runs Prettier with default args: `--write .`

---

### 🛠️ Example Config

Update format1 property in `nhb.scripts.config.mjs` file:

```js
format: {
    args: ['--write'],
    files: ['src', 'lib'],
    ignorePath: '.prettierignore'
}
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

# Scanned file-list

✅ Prettier formatting complete!
```

---

## ✅ `nhb-lint` — ESLint Linter Runner

Run ESLint across your project with a unified configuration system.
It **automatically detects your folders and patterns** from `nhb.scripts.config.mjs` and shows a **detailed lint summary** with all issues.

### ⚙️ Setup in `package.json`

```json
{
  "scripts": {
    "lint": "nhb-lint"
  }
}
```

Run:

```bash
pnpm lint
# or
npm run lint
# or
yarn lint
```

---

### ✨ Features

- ✅ Auto‑detects and ensures ESLint configuration (`.eslintrc.cjs` etc.)
- ✅ Loads lint config (`folders`, `patterns`) from `nhb.scripts.config.mjs`
- ✅ Rich output with a **bullet‑point summary** of all ESLint findings
- ✅ Shows scanned file count and total runtime
- ✅ Works with TypeScript & JavaScript projects (ESM only)

---

### 🛠️ Example Config

In `nhb.scripts.config.mjs`:

```js
lint: {
  folders: ['src', 'tests'],        // optional; default: ["src"]
  patterns: ['**/*.ts', '**/*.tsx'] // optional; default: ["**/*.ts"]
}
```

---

### 📦 Output Example

```bash
🚀 Run ESLint Linter
⏳ Linting Your Code in src, tests...

✓ Lint Summary
 • src/index.ts:12:3  warning  Unexpected console statement  no-console
 • src/utils/helpers.ts:45:10  error  Missing return type on function  @typescript-eslint/explicit-module-boundary-types
 • tests/app.spec.ts:5:1  error  Prefer const over let  prefer-const

✓ Scanned total 58 files in 2.43 seconds!
🎉 Linting completed in folders: src, tests
```

---

## 🔧 `nhb-fix` — ESLint Auto‑Fix Runner

Run ESLint with the `--fix` flag to **automatically fix** many common issues in your code.

### ⚙️ Setup in `package.json`

```json
{
  "scripts": {
    "fix": "nhb-fix"
  }
}
```

Run:

```bash
pnpm fix
# or
npm run fix
# or
yarn fix
```

---

### ✨ Features

- ✅ Same detection and configuration as `nhb-lint`
- ✅ Applies **auto‑fixable** rules (formatting, unused vars, etc.)
- ✅ Shows a **fix summary** with all changes applied
- ✅ Counts scanned files and shows runtime

---

### 📦 Output Example

```bash
🚀 Run ESLint Linter
⏳ Fixing Your Code in src...

✓ Fix Summary
 • src/utils/array.ts:12:1  fixed  Remove unused import
 • src/components/Button.tsx:5:1  fixed  Format JSX spacing

✓ Scanned total 58 files in 2.02 seconds!
🎉 Fixing completed in folders: src
```

---

### 🧭 Configuration

`nhb-fix` use the `fix` section in `nhb.scripts.config.mjs`:

```js
fix: {
  folders: ['src'],        // Folders to lint
  patterns: ['**/*.ts']    // Glob patterns per folder
}
```

---

### 💡 Pro Tips

- Run `pnpm lint` before pushing to catch errors early.
- Run `pnpm fix` to automatically resolve fixable issues.
- Combine with `nhb-commit` (`runFormatter` option) for a fully automated commit pipeline.

---

## 📊 `nhb-count` — Export Counter CLI

Analyze the structure of JavaScript/TypeScript modules to detect and count:

- Default exports
- Named exports
- Aliased named exports
- Type-only named exports (`export type { ... }`)

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

or use as:

```bash
pnpm nhb-count
```

---

### Configuration

In `nhb.scripts.config.mjs`:

```js
count: {
    defaultPath: '.', // Default path when no input is provided
    excludePaths: [   // Directories automatically excluded
        'node_modules',
        'dist', 
        'build'
    ]
}
```

### 🧭 Interactive CLI Prompts

When executed, the script will prompt you:

```bash
📂 Export Counter
───────────────────────────────────────────────────────────────────────────────-----
🎯 Please specify the path to a "js/ts/mjs" file or folder containing "js/ts/mjs" files.
   - Enter file path (with extension) to analyze one file
   - Enter folder path to scan recursively
   - Press Enter to use default path: [shows configured defaultPath]
```

### Exactly What Happens

1. If you **enter a file path**:
   - Must be `.js`, `.ts`, or `.mjs`
   - Analyzes only that file

2. If you **enter a folder path**:
   - Recursively scans for matching files
   - Automatically excludes `node_modules`, `dist`, `build`
   - Respects additional `excludePaths` from config

3. If you **press Enter**:
   - Uses `defaultPath` from config (defaults to `.`)

### Output Example

```bash
📦 Export Summary for "src/utils/math.ts":
🔸 Default Exports         : 1
🔹 Named Exports (Total)   : 5
   ┣ Direct                : 3
   ┗ Aliased               : 2 
🔺 Total Type Exports      : 4
```

Key Notes:

- No command-line arguments accepted
- Path must be entered interactively
- Default path comes from config
- Exclusion rules are automatic

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

### 🗑 `nhb-delete` – Interactive File & Folder Remover

Safely clean up your project with a guided, prompt‑driven experience to browse and delete files or directories.

> Deleting large or deeply nested folders from VS Code often takes a long time or fails unexpectedly — `nhb-delete` offers a faster and more reliable solution.

✅ Navigate into sub-folders or go back anytime  
✅ Multi‑select files and folders for deletion  
✅ Empty folders immediately prompt for deletion  
✅ Skips opening truly empty directories

#### 🚀 Usage

> **Note:** This must be configured in your `package.json` scripts:

 ```json
 {
   "scripts": {
     "delete": "nhb-delete"
   }
 }
 ```

or use as:

```bash
pnpm nhb-delete
```

#### ✨ Features

- **Interactive navigation:** step through your folders with clear prompts.
- **Smart listings:** if only files exist, jump straight to multi‑select.
- **Empty folder handling:** offers deletion instead of opening.
- **Safe confirmation:** always double‑checks before removal.

#### 📌 Example

```bash
🗑 Delete Directory/File(s)
? Enter a base path or choose current directory ›
❯ 📂 Current Directory
  ✏️  Enter manually
```

Use **Space** to select and **Enter** to confirm — perfect for cleaning up scaffolds, build artifacts, or leftover files.

---

> Built with ❤️ to make developer lives easier – because every second saved is a second earned.

## 📄 License

[MIT](LICENSE) © [Nazmul Hassan](mailto:nazmulnhb@gmail.com)
