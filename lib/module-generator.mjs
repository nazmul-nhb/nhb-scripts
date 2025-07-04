// @ts-check

import path from 'path';
import fs from 'fs/promises';
import chalk from 'chalk';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, resolve } from 'path';
import { convertStringCase } from 'nhb-toolbox';

/**
 * @typedef {import('../types/define-module-config.d.ts').FileEntry} FileEntry
 */

/**
 * @typedef {import('../types/define-module-config.d.ts').ModuleConfig} ModuleConfig
 */

/**
 * Load a built-in template by name.
 * @param {ModuleConfig['template']} templateName
 * @param {string} moduleName
 * @returns {Promise<Array<FileEntry>>}
 */
async function loadBuiltInTemplate(templateName, moduleName) {
    try {
        const __dirname = dirname(fileURLToPath(import.meta.url));
        const templateFile = resolve(__dirname, '../templates', `${templateName}.mjs`);

        const mod = await import(pathToFileURL(templateFile).href);
        const fnName = `${convertStringCase(templateName ?? "express-mongoose-zod", 'camelCase')}Template`;
        const generatorFn = mod[fnName];

        if (typeof generatorFn !== 'function') {
            throw new Error(`Template function "${fnName}" not found.`);
        }

        return generatorFn(moduleName);
    } catch (err) {
        throw new Error(`Error loading template "${templateName}": ${err.message}`);
    }
}


/**
 * Generate a module with given name and config.
 * @param {string} moduleName
 * @param {ModuleConfig} config
 */
export async function generateModule(moduleName, config) {
    const destination = config.destination ?? 'src/app/modules';
    const moduleDir = path.resolve(destination, moduleName);

    try {
        await fs.access(moduleDir);
        console.error(chalk.red(`🛑 Module "${moduleName}" already exists at ${destination}`));
        return;
    } catch {
        await fs.mkdir(moduleDir, { recursive: true });
    }

    /** @type {Array<FileEntry>} */
    let files = [];

    // Use custom template (if provided), else built-in
    if (Array.isArray(config.customTemplates) && config.customTemplates.length > 0) {
        files = config.customTemplates;
    } else {
        const template = config.template ?? 'express-mongoose-zod';
        files = await loadBuiltInTemplate(template, moduleName);
    }

    // Write all files
    await Promise.all(
        files.map(async ({ name, content }) => {
            const fullPath = path.join(moduleDir, name);
            await fs.writeFile(fullPath, content);
        })
    );

    console.log(chalk.green(`✅ Module "${moduleName}" generated successfully at ${destination}`));

    // Run onComplete hook
    config.hooks?.onComplete?.(moduleName);
}
