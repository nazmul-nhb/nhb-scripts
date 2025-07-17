// @ts-check

import { spinner } from '@clack/prompts';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

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
    const norm = path.posix.normalize(filePath.split(path.sep).join('/'))
    return norm.startsWith('./') ? norm : `./${norm}`
}

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
    const basePath = path.join(distPath, module)
    for (const candidate of candidates) {
        const fullPath = path.join(basePath, candidate)
        if (fs.existsSync(fullPath)) {
            const rel = path.relative(process.cwd(), fullPath)
            return normalizeExportPath(rel)
        }
    }
    return null
}

/**
 * Walk dist folder and find matching patterns
 * @param {string} base
 * @param {string} folderName
 * @returns {Array<{name:string, rel:string}>}
 */
const walkForPattern = (base, folderName) => {
    /** @type {Array<{name:string, rel:string}>} */
    const found = []

    /** @param {string} dir */
    const traverse = (dir) => {
        for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, d.name)
            if (d.isDirectory()) {
                if (d.name === folderName) {
                    const files = fs.readdirSync(full).filter((f) => f.endsWith('.d.ts'))
                    for (const file of files) {
                        const name = file.replace(/\.d\.ts$/, '')
                        const rel = path.relative(process.cwd(), path.join(full, file))
                        found.push({ name, rel: normalizeExportPath(rel) })
                    }
                } else {
                    traverse(full)
                }
            }
        }
    }

    traverse(base);

    return found;
}

/**
 * Create exports field
 * @param {string} distPath
 * @param {string[]} modules
 * @param {string[]} candidates
 * @param {{pattern:string, folderName:string}[]} patterns
 * @param {Record<string, {types:string, import?:string, require?:string, default?:string}>} extraStatic
 */
const createExports = (distPath, modules, candidates, patterns, extraStatic) => {
    const dist = distPath?.split("/")?.[0]

    /** @type {Exports} */
    const exportsField = {
        './package.json': './package.json',
        '.': {
            types: `./${dist}/dts/index.d.ts`,
            import: `./${dist}/esm/index.js`,
            require: `./${dist}/cjs/index.js`,
        },
        ...extraStatic
    };

    /** @type {[string,string][]} */
    const validModules = [];

    // standard modules
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

    // custom pattern scanning (plugins or others)
    for (const { pattern, folderName } of patterns) {
        const matches = walkForPattern(distPath, folderName);

        for (const match of matches) {
            const esm = normalizeExportPath(
                path.relative(process.cwd(), path.join(distPath, '..', 'esm', match.rel.replace(/\.d\.ts$/, '.js')))
            )
            const cjs = normalizeExportPath(
                path.relative(process.cwd(), path.join(distPath, '..', 'cjs', match.rel.replace(/\.d\.ts$/, '.js')))
            )
            const types = normalizeExportPath(
                path.relative(process.cwd(), path.join(distPath, match.rel))
            )

            exportsField[`./${pattern}/${match.name}`] = {
                types,
                import: esm,
                require: cjs,
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
    const dist = distPath?.split("/")?.[0]

    const versions = {};

    for (const [key, value] of Object.entries(extraStatic)) {
        if (value.types) {
            versions[key.replace(/^\.\//, '')] = [value.types.replace(/^\.\//, '')]
        }
    }

    for (const [module, resolved] of validModules) {
        versions[`${module}/types`] = [resolved.replace('./', '')];
    }

    for (const p of matchedPatterns) {
        const rel = path.relative(process.cwd(), path.join(distPath, p.rel.replace(/^\.\//, '')))
        versions[`${p.pattern}/${p.name}`] = [rel.replace(/\\/g, '/')]
    }


    return {
        '*': { ...versions, },
    };
};

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
export const fixTypeExports = (options) => {
    const distPath =
        options?.distPath ?
            path.isAbsolute(options.distPath) ?
                options.distPath
                : path.resolve(process.cwd(), options.distPath)
            : path.resolve(process.cwd(), 'dist/dts');

    const packageJsonPath =
        options?.packageJsonPath ?
            path.isAbsolute(options.packageJsonPath) ?
                options.packageJsonPath
                : path.resolve(process.cwd(), options.packageJsonPath)
            : path.resolve(process.cwd(), 'package.json');

    const s = spinner();
    s.start(chalk.yellowBright(`Updating 'exports' and 'typeVersions' in ${packageJsonPath}`));

    const candidates = options?.typeFileCandidates ?? ['types.d.ts', 'interfaces.d.ts'];
    const patterns = options?.extraPatterns ?? [
        { pattern: 'plugins', folderName: 'plugins' },
    ];

    const extraStatic = options?.extraStatic ?? {}

    const modules = getModulePaths(distPath);

    const { exportsField, validModules, matchedPatterns } = createExports(
        distPath,
        modules,
        candidates,
        patterns,
        extraStatic
    );

    /** @type {PackageJson} */
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    pkg.exports = exportsField;
    pkg.typesVersions = createTypesVersions(distPath, validModules, matchedPatterns, extraStatic);

    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));

    s.stop(
        chalk.greenBright(
            chalk.green('✓ ') +
            chalk.yellow.bold('package.json ') +
            chalk.green.bold('has been updated with ') +
            chalk.yellowBright.bold('exports') +
            chalk.green(' and ') +
            chalk.yellowBright.bold('typesVersions') +
            chalk.green(' fields!'),
        )
    );
};
