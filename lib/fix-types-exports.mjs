// @ts-check

import { spinner } from '@clack/prompts';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { parsePackageJson, writeToPackageJson } from './package-json-utils.mjs';

/**
 * @typedef {Required<import('type-fest').PackageJson>} PackageJson
 * @typedef {Required<import('type-fest').PackageJson.Exports>} Exports
 *
 * @typedef {import('../types/index.d.ts').FixTypeExportsOptions} FixTypeExportsOptions
 */

/**
 * Normalize path to posix style and ensure leading './'
 * @param {string} filePath
 */
const normalizeExportPath = (filePath) => {
	const posixPath = filePath.split(path.sep).join('/');
	return posixPath.startsWith('./') ? posixPath : `./${posixPath}`;
};

/**
 * Recursively collect subdirectories at the first level under distPath
 * @param {string} distPath
 * @returns {string[]}
 */
const getModulePaths = (distPath) => {
	return fs
		.readdirSync(distPath, { withFileTypes: true })
		.filter((d) => d.isDirectory())
		.map((d) => d.name);
};

/**
 * Resolve a type file within a module dir
 * @param {string} distPath
 * @param {string[]} candidates
 * @param {string} module
 * @returns {string | null}
 */
const resolveTypeFile = (distPath, candidates, module) => {
	const basePath = path.join(distPath, module);
	for (const candidate of candidates) {
		const fullPath = path.join(basePath, candidate);
		if (fs.existsSync(fullPath)) {
			// make path relative to CWD
			const rel = path.relative(process.cwd(), fullPath);
			return normalizeExportPath(rel);
		}
	}
	return null;
};

/**
 * Walk dist folder and find matching patterns
 * @param {string} base (distPath)
 * @param {string} folderName
 * @returns {Array<{name:string, rel:string}>}
 */
const walkForPattern = (base, folderName) => {
	/** @type {Array<{name:string, rel:string}>} */
	const found = [];

	/** @param {string} dir */
	const traverse = (dir) => {
		for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
			const full = path.join(dir, d.name);
			if (d.isDirectory()) {
				if (d.name === folderName) {
					for (const file of fs
						.readdirSync(full)
						.filter((f) => f.endsWith('.d.ts'))) {
						const name = file.replace(/\.d\.ts$/, '');
						const rel = path.relative(base, path.join(full, file));
						found.push({ name, rel: rel.replace(/\\/g, '/') });
					}
				} else {
					traverse(full);
				}
			}
		}
	};

	traverse(base);

	return found;
};

/**
 * Create exports field
 * @param {string} distPath
 * @param {string[]} modules
 * @param {string[]} candidates
 * @param {{pattern:string, folderName:string}[]} patterns
 * @param {Record<string, {types:string, import?:string, require?:string, default?:string}>} extraStatic
 */
const createExports = (distPath, modules, candidates, patterns, extraStatic) => {
	const distRoot = path.relative(process.cwd(), path.dirname(distPath));
	const dtsRoot = path.basename(distPath);

	/** @type {Exports} */
	const exportsField = {
		'./package.json': './package.json',
		'.': {
			types: normalizeExportPath(path.join(distRoot, dtsRoot, 'index.d.ts')),
			import: normalizeExportPath(path.join(distRoot, 'esm', 'index.js')),
			require: normalizeExportPath(path.join(distRoot, 'cjs', 'index.js')),
		},
		...extraStatic,
	};

	/** @type {[string,string][]} */
	const validModules = [];

	for (const module of modules) {
		const resolved = resolveTypeFile(distPath, candidates, module);
		if (resolved) {
			exportsField[`./${module}/types`] = {
				types: resolved,
				default: resolved,
			};
			validModules.push([module, resolved]);
		}
	}

	/** @type {Array<{name:string,rel:string,pattern:string}>} */
	const matchedPatterns = [];

	for (const { pattern, folderName } of patterns) {
		const matches = walkForPattern(distPath, folderName);

		for (const match of matches) {
			const typesPath = normalizeExportPath(path.join(distRoot, dtsRoot, match.rel));
			const esmPath = normalizeExportPath(
				path.join(distRoot, 'esm', match.rel.replace(/\.d\.ts$/, '.js'))
			);
			const cjsPath = normalizeExportPath(
				path.join(distRoot, 'cjs', match.rel.replace(/\.d\.ts$/, '.js'))
			);

			exportsField[`./${pattern}/${match.name}`] = {
				types: typesPath,
				import: esmPath,
				require: cjsPath,
			};

			matchedPatterns.push({ ...match, pattern });
		}
	}

	return { exportsField, validModules, matchedPatterns };
};

/**
 * Create typesVersions
 * @param {string} distPath
 * @param {[string,string][]} validModules
 * @param {Array<{ name:string, rel:string, pattern:string }>} matchedPatterns
 * @param {Record<string,{types:string}>} extraStatic
 */
const createTypesVersions = (distPath, validModules, matchedPatterns, extraStatic) => {
	const distRoot = path.relative(process.cwd(), path.dirname(distPath));
	const dtsRoot = path.basename(distPath);

	const versions = {};

	for (const [key, value] of Object.entries(extraStatic)) {
		if (value.types) {
			versions[key.replace(/^\.\//, '')] = [value.types.replace(/^\.\//, '')];
		}
	}

	for (const [module, resolved] of validModules) {
		versions[`${module}/types`] = [resolved.replace(/^\.\//, '')];
	}

	for (const p of matchedPatterns) {
		const rel = normalizeExportPath(path.join(distRoot, dtsRoot, p.rel));
		versions[`${p.pattern}/${p.name}`] = [rel.replace(/^\.\//, '')];
	}

	return { '*': versions };
};

/**
 * * Updates the `exports` and `typesVersions` fields of your `package.json` based on the generated type declaration files under your distribution folder.
 *
 * _This helper scans your `dist` (or custom) directory for modules and optionally plugin-like subpaths, then dynamically builds a `package.json` exports map._
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
export const fixTypeExports = async (options) => {
	const distPath =
		options?.distPath ?
			path.isAbsolute(options.distPath) ?
				options.distPath
			:	path.resolve(process.cwd(), options.distPath)
		:	path.resolve(process.cwd(), 'dist/dts');

	const packageJsonPath =
		options?.packageJsonPath ?
			path.isAbsolute(options.packageJsonPath) ?
				options.packageJsonPath
			:	path.resolve(process.cwd(), options.packageJsonPath)
		:	path.resolve(process.cwd(), 'package.json');

	const s = spinner();
	s.start(
		chalk.yellowBright(`Updating 'exports' and 'typeVersions' in ${packageJsonPath}`)
	);

	const candidates = options?.typeFileCandidates ?? ['types.d.ts', 'interfaces.d.ts'];
	const patterns = options?.extraPatterns ?? [
		{ pattern: 'plugins', folderName: 'plugins' },
	];

	const extraStatic = options?.extraStatic ?? {};

	const modules = getModulePaths(distPath);

	const { exportsField, validModules, matchedPatterns } = createExports(
		distPath,
		modules,
		candidates,
		patterns,
		extraStatic
	);

	const pkg = parsePackageJson();

	pkg.exports = exportsField;
	pkg.typesVersions = createTypesVersions(
		distPath,
		validModules,
		matchedPatterns,
		extraStatic
	);

	await writeToPackageJson(pkg);

	s.stop(
		chalk.greenBright(
			chalk.green('✓ ') +
				chalk.yellow.bold('package.json ') +
				chalk.green.bold('has been updated with ') +
				chalk.yellowBright.bold('exports') +
				chalk.green(' and ') +
				chalk.yellowBright.bold('typesVersions') +
				chalk.green(' fields!')
		)
	);
};
