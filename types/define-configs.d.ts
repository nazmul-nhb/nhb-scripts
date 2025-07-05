import type { LooseLiteral } from 'nhb-toolbox/utils/types';

/**  A single file to generate inside a module. */
export interface FileEntry {
	name: string;
	content: string;
}

/** Lifecycle hooks for module generation. */
export interface ModuleHooks {
	/** Called before generation starts */
	onGenerate?: (moduleName: string) => void;
	/**  Called after generation finishes */
	onComplete?: (moduleName: string) => void;
}

/** Custom template definition */
export interface CustomTemplate {
	destination?: string;
	files: FileEntry[];
}

/** User configuration for the NHB Module Generator. */
export interface ModuleConfig {
	/** Name of built-in template (e.g., "express-mongoose-zod") */
	template?: LooseLiteral<'express-mongoose-zod'>;
	/** Directory where modules should be generated (default: `"src/app/modules"`) */
	destination?: string;
	/**  Optional list of custom file definitions */
	customTemplates?: Record<string, CustomTemplate>;
	/** Optional lifecycle hook functions */
	hooks?: ModuleHooks;
	/** Forcefully create a module even if it already exists */
	force?: boolean;
}

/**
 * * Define module config for NHB Module Generator.
 *
 * @param config User configuration for the NHB Module Generator.
 */
export declare function defineModuleConfig(config: ModuleConfig): ModuleConfig;

/** User configuration for the NHB Format script. */
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

/**
 * * Define prettier config for NHB Format script.
 *
 * @param config User configuration for the NHB Format script.
 */
export declare function defineFormatConfig(config: FormatConfig): FormatConfig;

/** User configuration for the NHB Commit script. */
export interface CommitConfig {
	/** Run Prettier formatter before committing */
	runFormatter?: boolean;
}

/**
 * * Define commit config for NHB Commit script.
 *
 * @param config User configuration for the NHB Commit script.
 */
export declare function defineCommitConfig(config: CommitConfig): CommitConfig;
