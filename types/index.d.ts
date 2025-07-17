import type { Options as ExecaOptions } from 'execa';
import type { AsyncFunction, VoidFunction } from 'nhb-toolbox/types';
import type { LooseLiteral } from 'nhb-toolbox/utils/types';

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
	moduleName: string,
) => FileEntry[];

/** * Custom template definition for module scaffolding. */
export interface CustomTemplate {
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
	/** Name of built-in template (e.g., "express-mongoose-zod") */
	template?: LooseLiteral<'express-mongoose-zod'>;
	/** Directory where modules should be generated (default: `"src/modules"`) */
	destination?: string;
	/**
	 * Whether to create a subfolder using the module names.
	 * If `false`, files will be created directly inside the destination.
	 * Defaults to `true`.
	 */
	createFolder?: boolean;
	/**  Optional list of custom file definitions */
	customTemplates?: Record<string, CustomTemplate>;
	/** Optional lifecycle hook functions */
	hooks?: ModuleHooks;
	/** Forcefully create a module even if it already exists */
	force?: boolean;
}

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
	/** Run Prettier formatter before committing */
	runFormatter?: boolean;
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
	/** The command to run, e.g., `tsc` or `rimraf`. */
	cmd: string;
	/** Arguments to pass to the command. */
	args?: string[];
	/** Extra options to pass to execa (e.g., stdio). */
	options?: ExecaOptions;
}

/** User configuration for `nhb-build` script. */
export interface BuildConfig {
	/** The output folder name, default is `"dist"`. */
	distFolder?: string;
	/** The sequence of commands to run for building. */
	commands?: BuildCommand[];
	/** Hooks to run after the build completes.*/
	after?: Array<VoidFunction | AsyncFunction<void>>;
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
}

/**
 * * Define commit config for `nhb-scripts`.
 *
 * @param config User configuration for `nhb-scripts`.
 */
export declare function defineScriptConfig(config: ScriptConfig): ScriptConfig;

/**
 * * Fix `.js` extensions in `ESM` files.
 * @param dir - Directory to fix
 * @param isRoot - Internal flag to show spinner only once
 */
export declare async function fixJsExtensions(dir: string, isRoot?: boolean): Promise<void>;

/**
 * * Fix `.ts` extensions in `ESM` files.
 * @param dir - Directory to fix
 * @param isRoot - Internal flag to show spinner only once
 */
export declare async function fixTsExtensions(dir: string, isRoot?: boolean): Promise<void>;

/** * Run prettier formatter */
export declare async function runFormatter(): Promise<void>;

/** Configuration options for `fixTypeExports` */
export interface FixTypeExportsOptions {
   /** Absolute or relative path to the folder containing `dts` output */
	distPath?: string;
	/** Absolute or relative path to the `package.json` */
	packageJsonPath?: string;
	/** Candidate type filenames (default: `['types.d.ts', 'interfaces.d.ts']`) */
	typeFileCandidates?: string[];
	/** Extra export scanning patterns, e.g. plugins */
	extraPatterns?: Array<{
		/** Patten string to include in the package.json */
		pattern: string;
		/** Folder in which it will reside */
        folderName: string;
    }>;
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
export declare function fixTypeExports(options: FixTypeExportsOptions): void;