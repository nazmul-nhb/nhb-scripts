#!/usr/bin/env node
// bin/bin/module.mjs

// @ts-check

import { confirm, intro, isCancel, select, text } from '@clack/prompts';
import chalk from 'chalk';
import { existsSync } from 'fs';
import minimist from 'minimist';
import path from 'path';
import {
	normalizeBooleanResult,
	normalizeStringResult,
	showCancelMessage,
	validateStringInput,
} from '../lib/clack-utils.mjs';
import { loadUserConfig } from '../lib/config-loader.mjs';
import { generateModule } from '../lib/module-generator.mjs';

/** @typedef {import('../types/index.d.ts').ModuleConfig} ModuleConfig */
/** @typedef {ModuleConfig['template']} ModuleName */

const argv = minimist(process.argv.slice(2), {
	string: ['template', 'name', 'destination'],
	boolean: ['force', 'create-folder'],
	alias: {
		t: 'template',
		n: 'name',
		f: 'force',
		d: 'destination',
		cf: 'create-folder',
	},
	default: {
		force: false,
		'create-folder': true,
	},
});

/** @returns {Promise<string>} */
async function getModuleNameFromPrompt() {
	return normalizeStringResult(
		await text({
			message: chalk.cyan('📦 Enter module name:'),
			validate: validateStringInput,
		}),
	);
}

/**
 * @param {string} defaultPath
 * @returns {Promise<string>}
 */
async function getSourcePath(defaultPath) {
	const result = normalizeStringResult(
		await text({
			message: chalk.cyan(
				`📂 Enter a source path (Default is ${defaultPath || 'src/modules'}):`,
			),
			placeholder: defaultPath,
		}),
	);

	return result ?? defaultPath;
}

/**
 * @param {Array<{title:string, value:ModuleName}>} choices
 * @returns {Promise<ModuleName>}
 */
async function getTemplateFromPrompt(choices) {
	const result = /** @type {ModuleName} */ (
		await select({
			message: chalk.magenta('📂 Choose a module template'),
			options: choices.map((c) => ({
				value: c.value,
				label: c.title,
			})),
		})
	);

	if (isCancel(result)) {
		showCancelMessage();
	}

	return result;
}

/**
 * Prompt to confirm folder creation
 * @param {string} moduleName
 * @returns {Promise<boolean>}
 */
async function askCreateFolder(moduleName) {
	return normalizeBooleanResult(
		await confirm({
			message: chalk.blueBright(
				`❔ Do you want to generate files inside a folder named "${moduleName}"?`,
			),
			initialValue: true,
		}),
	);
}

/**
 * Prompt to confirm overwrite
 * @param {string} modulePath
 * @returns {Promise<boolean>}
 */
async function askOverwrite(modulePath) {
	return normalizeBooleanResult(
		await confirm({
			message: chalk.yellow(
				`⛔ Files in "${modulePath}" already exist. Overwrite conflicting files/folders?`,
			),
			initialValue: false,
		}),
	);
}

async function createModule() {
	intro(chalk.cyan.bold('📂 NHB Module Generator'));

	const config = (await loadUserConfig()).module ?? {};

	/** @type {Array<{title: string, value: ModuleName}>} */
	const customTemplates = Object.keys(config?.customTemplates || {}).map((key) => ({
		title: `🧩 Custom: ${key}`,
		value: key,
	}));

	const builtInTemplates = [
		{ title: 'Express + Mongoose + Zod', value: 'express-mongoose-zod' },
	];

	const moduleName = /** @type {string} */ (
		argv.name || (await getModuleNameFromPrompt())
	);
	if (!moduleName) {
		showCancelMessage('🛑 Module name is required!');
	}

	const template =
		argv.template ||
		(await getTemplateFromPrompt([...builtInTemplates, ...customTemplates]));

	const dest =
		template ?
			config.customTemplates?.[template]?.destination ||
			config?.destination ||
			'src/modules'
		:	'src/modules';

	const destination = argv.destination || (await getSourcePath(dest));
	config.destination = destination;

	const tpl = config.customTemplates?.[template ?? ''];

	let shouldCreateFolder = true;

	if (!tpl || tpl.createFolder === undefined) {
		shouldCreateFolder = await askCreateFolder(moduleName);
	}

	config.createFolder = shouldCreateFolder;

	const modulePath =
		shouldCreateFolder ?
			path.resolve(destination, moduleName)
		:	path.resolve(destination);

	if (existsSync(modulePath) && !argv.force && !config.force) {
		const shouldOverwrite = await askOverwrite(modulePath);
		if (!shouldOverwrite) {
			showCancelMessage('⛔ Module generation cancelled by user!');
		}
		config.force = true;
	} else {
		config.force = /** @type {boolean} */ argv.force || false;
	}

	config.hooks?.onGenerate?.(moduleName);

	if (template) {
		config.template = template;
	}

	await generateModule(moduleName, config);

	config.hooks?.onComplete?.(moduleName);
}

createModule();
