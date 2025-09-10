import type { Options as ExecaOptions } from 'execa';
import type { AsyncFunction, VoidFunction } from 'nhb-toolbox/types';

/**
 * A single file definition to be generated as part of a module.
 *
 * Each `FileEntry` represents a file with a relative path and its content.
 * The generator will automatically create directories if the `name` includes folder segments.
 */
export interface FileEntry {
	/**
	 * The relative file path (can include folders) where the file will be created.
	 *
	 * @example "index.ts"
	 * @example "routes/user.route.ts"
	 */
	name: string;

	/**
	 * The full content of the file to be written.
	 *
	 * You can use template strings to insert dynamic values like module name.
	 *
	 * @example `// controller for user module`
	 */
	content: string;
}

/** Lifecycle hooks for module generation. */
export interface ModuleHooks {
	/** Called before generation starts */
	onGenerate?: (moduleName: string) => void;
	/**  Called after generation finishes */
	onComplete?: (moduleName: string) => void;
}

/**
 * A function that receives the module name and returns an array of FileEntry objects.
 *
 * @param moduleName - The name of the module being generated. Useful for dynamic filenames or contents.
 * @returns A list of files to generate.
 */
export type FileGenerator = (
	/** The name of the module being generated. Useful for dynamic filenames or contents. */
	moduleName: string
) => FileEntry[];

/** * Custom template definition for module scaffolding. */
export interface CustomTemplate extends ModuleHooks {
	/**
	 * Optional path where the module should be generated.
	 *
	 * If not provided, the global or default destination from the config will be used.
	 * Can be absolute or relative (e.g., `src/modules`).
	 */
	destination?: string;

	/**
	 * Whether to create a subfolder using the module name.
	 * If `false`, files will be created directly inside the destination.
	 * Defaults to `true`.
	 */
	createFolder?: boolean;

	/**
	 * List of files to generate for the module.
	 *
	 * This can be:
	 * - A static array of `FileEntry` objects.
	 * - A function that takes the `moduleName` and returns them dynamically.
	 *
	 * @example // Static file list:
	 * files: [{ name: 'index.ts', content: '// static index' }]
	 *
	 * @example // Dynamic file generator:
	 * files: (moduleName) => [{ name: `${moduleName}.ts`, content: `// dynamic for ${moduleName}` }]
	 */
	files: FileEntry[] | FileGenerator;
}

/** User configuration for `nhb-module` script. */
export interface ModuleConfig {
	/** Name of a template to be used as default (e.g., "express-mongoose-zod") */
	defaultTemplate?: string;
	/** Directory where modules should be generated (default: `"src/modules"`) */
	destination?: string;
	/**
	 * Whether to create a subfolder using the module names.
	 * If `false`, files will be created directly inside the destination.
	 * Defaults to `true`.
	 */
	createFolder?: boolean;
	/**  Record of custom template definitions */
	templates: Record<string, CustomTemplate>;
	/** Optional lifecycle hook functions that run before and after module generation */
	hooks?: ModuleHooks;
	/** Forcefully create a module even if it already exists */
	force?: boolean;
}

/**
 * * Generates a module (set of files) for an Express.js application using Mongoose and Zod for validation.
 * _This template includes routes, controllers, services, models, validations, and types._
 * @param moduleName - The name of the module being generated. Useful for dynamic filenames or contents.
 * @param useAlias - Whether to use import alias `@/` instead of `src/app/*`, must configure `tsconfig` and `package.json`. Defaults to `false`.
 * @returns An array of `FileEntry` objects representing the files to be generated.
 */
export declare function expressMongooseZodTemplate(
	moduleName: string,
	useAlias?: boolean
): FileEntry[];

/** User configuration for `nhb-format` script. */
export interface FormatConfig {
	/**
	 * Additional CLI arguments to pass to Prettier.
	 * Example: `["--write"]`, `["--check"]`
	 */
	args?: string[];

	/**
	 * Files or directories to format.
	 * Default is `["."]` (entire project).
	 * Example: `["src", "scripts"]`
	 */
	files?: string[];

	/**
	 * Path to custom `.prettierignore` file.
	 * If not provided, falls back to `.prettierignore` in the root directory.
	 */
	ignorePath?: string;
}

/** User configuration for `nhb-commit` script. */
export interface CommitConfig {
	/** Run Prettier formatter before committing. Default is `false`. */
	runFormatter?: boolean;
	/** Pre-hook to run before commit and push. */
	runBefore?: () => void;
	/** Post-hook to run after commit and push. */
	runAfter?: () => void;
}

/** User configuration for `nhb-count` script.*/
export interface CountConfig {
	/** Set default path (folder/file). Default is `.` (project root) */
	defaultPath?: string;
	/** Exclude directories from being scanned. Default is `['node_modules', 'dist', 'build']` */
	excludePaths?: string[];
}

/**  Represents a single build command that will be executed by `execa`. */
export interface BuildCommand {
	/** The command to run, e.g., `tsc`, `rimraf` etc. Must be installed in project deps. */
	cmd: string;
	/** Arguments to pass to the command. Invalid args will throw errors. */
	args?: string[];
	/** Extra options to pass to `execa` (e.g., `stdio`). */
	options?: ExecaOptions;
}

/** User configuration for `nhb-build` script. */
export interface BuildConfig {
	/** The output folder name, default is `"dist"`. */
	distFolder?: string;
	/** Whether to delete the `dist` (or custom) folder before each build. Defaults to `true`. */
	deleteDist?: boolean;
	/** Whether to display output file list. Default is `false`. */
	showOutputs?: boolean;
	/** The sequence of commands to run for building. */
	commands?: BuildCommand[];
	/** Hooks to run after the build completes. */
	after?: Array<VoidFunction | AsyncFunction<void>>;
}

/** User configuration for `nhb-lint` and `nhb-fix` scripts. */
export interface LintConfig {
	/** Folders to lint/fix. Defaults to `'src'` */
	folders?: string[];
	/** `globby` patterns to count files (optional). Defaults to `'**\/*.ts'` */
	patterns?: string[];
}

/** User configuration for `nhb-scripts`. */
export interface ScriptConfig {
	/** User configuration for `nhb-format` script. */
	format?: FormatConfig;
	/** User configuration for `nhb-commit` script. */
	commit?: CommitConfig;
	/** User configuration for `nhb-module` script. */
	module?: ModuleConfig;
	/** User configuration for `nhb-count` script.*/
	count?: CountConfig;
	/** User configuration for `nhb-build` script. */
	build?: BuildConfig;
	/** User configuration for `nhb-lint` script. */
	lint?: LintConfig;
	/** User configuration for `nhb-fix` script. */
	fix?: LintConfig;
}

/**
 * * Define configuration for `nhb-scripts`.
 *
 * @param config User configuration for `nhb-scripts`.
 */
export declare function defineScriptConfig(config: ScriptConfig): ScriptConfig;

/**
 * * Fix `.js` extensions in `ESM` files.
 * @param dir - Directory to fix
 * @param isRoot - Internal flag to show spinner only once
 */
export declare function fixJsExtensions(dir: string, isRoot?: boolean): Promise<void>;

/**
 * * Fix `.ts` extensions in `ESM` files.
 * @param dir - Directory to fix
 * @param isRoot - Internal flag to show spinner only once
 */
export declare function fixTsExtensions(dir: string, isRoot?: boolean): Promise<void>;

/** * Run prettier formatter */
export declare function runFormatter(): Promise<void>;

/**
 * Configuration options for `fixTypeExports`.
 *
 * These options let you control how your `package.json` is updated with `exports`
 * and `typesVersions` entries by scanning your generated type declarations (`.d.ts`)
 * and optional extra patterns (like plugins).
 */
export interface FixTypeExportsOptions {
	/**
	 * Path to the directory containing your generated type declarations (`.d.ts`).
	 *
	 * - Can be absolute or relative to `process.cwd()`.
	 * - Defaults to `dist/dts`.
	 *
	 * For example: `"build/types"` or `"/absolute/path/to/dts"`.
	 */
	distPath?: string;

	/**
	 * Path to your `package.json` file to update.
	 *
	 * - Can be absolute or relative to `process.cwd()`.
	 * - Defaults to `package.json` in the project root.
	 */
	packageJsonPath?: string;

	/**
	 * List of candidate filenames to look for within each module directory.
	 *
	 * When scanning a module folder, the first matching file from this list
	 * will be used as the `types` entry in `exports` and `typesVersions`.
	 *
	 * Defaults to: `["types.d.ts", "interfaces.d.ts"]`.
	 */
	typeFileCandidates?: string[];

	/**
	 * Extra scanning patterns for subpaths like plugins or addons.
	 *
	 * Each entry specifies:
	 * - `pattern`: the prefix to use in the resulting `exports` key
	 * - `folderName`: the actual folder name under which these files are located
	 *
	 * For example, `{ pattern: "plugins", folderName: "plugins" }`
	 * will scan for `.d.ts` files in any `plugins` subfolder and create
	 * export entries like `"./plugins/<fileName>"`.
	 */
	extraPatterns?: Array<{
		/** The export path prefix (e.g., `"plugins"` will create `"./plugins/<name>"` in exports). */
		pattern: string;
		/** The directory name to search for (e.g., `"plugins"`). */
		folderName: string;
	}>;

	/**
	 * Static export mappings to always include.
	 *
	 * These are directly merged into `pkg.exports`, bypassing automatic scanning.
	 * Keys should be the export path (e.g., `"./constants"`), and values
	 * should specify the corresponding files.
	 */
	extraStatic?: Record<
		string,
		{
			/** Path to the `.d.ts` file for this export. */
			types: string;
			/** Optional path to the ESM implementation. */
			import?: string;
			/** Optional path to the CJS implementation. */
			require?: string;
			/** Optional path to use as the default export target. */
			default?: string;
		}
	>;
}

/**
 * Updates the `exports` and `typesVersions` fields of your `package.json`
 * based on the generated type declaration files under your distribution folder.
 *
 * This helper scans your `dist` (or custom) directory for modules and optionally
 * plugin-like subpaths, then dynamically builds a `package.json` exports map.
 *
 * ✅ **Features:**
 * - Automatically detects `types.d.ts` or `interfaces.d.ts` in module folders.
 * - Adds them to `package.json` under `exports` and `typesVersions`.
 * - Handles both ESM and CJS entry points.
 * - Supports configurable `distPath` and `packageJsonPath`.
 *
 * @param {FixTypeExportsOptions} [options] - Optional configuration.
 *
 * @example
 * // Using defaults (scans ./dist/dts and updates ./package.json)
 * fixTypeExports();
 *
 * @example
 * // Custom dist folder and package.json path
 * fixTypeExports({
 *   distPath: 'build/types',
 *   packageJsonPath: './pkg/package.json',
 *   extraPatterns: ['addons', 'plugins']
 * });
 *
 */
export declare function fixTypeExports(options: FixTypeExportsOptions): Promise<void>;

/**
 * * Adds a module name to the `COLLECTIONS` array in `src/app/constants/index.ts`.
 * @param moduleName Name of the module.
 * @remarks Intended to be used with the `onComplete` hook of the `nhb-module` script.
 */
export declare function updateCollection(moduleName: string): void;

/**
 * * Adds route details to `src/app/routes/index.ts` for the given module.
 * @param moduleName Name of the module.
 * @param useAlias - Whether to use import alias `@/` instead of `src/app/*`, must configure `tsconfig` and `package.json`. Defaults to `false`.
 * @remarks Intended to be used with the `onComplete` hook of the `nhb-module` script.
 */
export declare function updateRoutes(moduleName: string, useAlias?: boolean): void;
