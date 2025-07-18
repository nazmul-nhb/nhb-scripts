// @ts-check

import { outro } from '@clack/prompts';
import chalk from 'chalk';
import fs from 'fs/promises';
import { convertStringCase, isNotEmptyObject } from 'nhb-toolbox';
import path, { dirname, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

/**
 * @typedef {import('../types/index.d.ts').FileEntry} FileEntry
 * @typedef {import('../types/index.d.ts').ModuleConfig} ModuleConfig
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
		const fnName = `${convertStringCase(templateName || 'express-mongoose-zod', 'camelCase')}Template`;
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
	/** @type {Array<FileEntry>} */
	let files = [];
	let createFolder = config?.createFolder;
	let destination = config.destination || 'src/modules';

	const template = config.template || 'express-mongoose-zod';

	if (isNotEmptyObject(config.customTemplates) && config.customTemplates?.[template]) {
		const tpl = config.customTemplates[template];
		files = typeof tpl.files === 'function' ? tpl.files(moduleName) : tpl.files;
		destination = config.destination || tpl.destination || 'src/modules';
		createFolder = tpl.createFolder !== false;
	} else {
		files = await loadBuiltInTemplate(template, moduleName);
	}

	const moduleDir =
		createFolder ? path.resolve(destination, moduleName) : path.resolve(destination);

	try {
		await fs.access(moduleDir);
	} catch {
		await fs.mkdir(moduleDir, { recursive: true });
	}

	// Write all files
	await Promise.all(
		files.map(async ({ name, content }) => {
			const normalizedName = path.normalize(name);

			if (normalizedName.startsWith('..') || path.isAbsolute(normalizedName)) {
				throw new Error(`Unsafe file path: ${normalizedName}`);
			}

			const fullPath = path.join(moduleDir, normalizedName);

			await fs.mkdir(path.dirname(fullPath), { recursive: true });
			await fs.writeFile(fullPath, content);
		}),
	);

	outro(
		chalk.green(`✓ Module "${moduleName}" generated successfully in ${destination}`),
	);
}
