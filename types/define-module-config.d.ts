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
