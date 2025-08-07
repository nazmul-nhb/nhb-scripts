#!/usr/bin/env node
// bin/bin/module.mjs

// @ts-check

import { confirm, intro, select, text } from '@clack/prompts';
import chalk from 'chalk';
import { existsSync } from 'fs';
import minimist from 'minimist';
import { convertStringCase, isNotEmptyObject, isValidArray } from 'nhb-toolbox';
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
		})
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
				`📂 Enter a source path (Default is ${defaultPath || 'src/modules'}):`
			),
			placeholder: defaultPath,
		})
	);

	return result ?? defaultPath;
}

/**
 * @param {Array<{title:string, value:string}>} choices
 * @param {string | undefined} defaultTemplate
 * @returns {Promise<string>}
 */
async function getTemplateFromPrompt(choices, defaultTemplate) {
	return normalizeStringResult(
		await select({
			message: chalk.magenta('📂 Choose a module template'),
			options: choices.map((c) => ({
				value: c.value,
				label: c.title,
				...(c.value === defaultTemplate && { hint: 'default' }),
			})),
			initialValue: defaultTemplate,
		})
	);
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
				`❔ Do you want to generate files inside a folder named "${moduleName}"?`
			),
			initialValue: true,
		})
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
				`⛔ Files in "${modulePath}" already exist. Overwrite conflicting files/folders?`
			),
			initialValue: false,
		})
	);
}

async function createModule() {
	intro(chalk.cyan.bold('🧩 NHB Module Generator'));

	const config = (await loadUserConfig()).module;

	if (!isNotEmptyObject(config)) {
		showCancelMessage(
			'🛑 No config found for module generation! Please add module config in "nhb.scripts.config.mjs" > "module".'
		);
		return;
	}

	/** @type {Array<{title: string, value: string}>} */
	const customTemplates = Object.keys(config?.templates || {}).map((key) => ({
		title: `🧩 ${convertStringCase(key?.replace(/[-._]/g, ' '), 'Title Case')}`,
		value: key,
	}));

	if (!isValidArray(customTemplates)) {
		showCancelMessage(
			'🛑 No templates found in module config! Please add a template in "nhb.scripts.config.mjs" > "module" > "templates".'
		);
	}

	const moduleName =
		/** @type {string} */ (argv.name) || (await getModuleNameFromPrompt());

	if (!moduleName) {
		showCancelMessage('🛑 Module name is required!');
	}

	const template =
		/** @type {string} */ (argv.template) ||
		(await getTemplateFromPrompt(customTemplates, config.defaultTemplate));

	const dest =
		template ?
			config.templates?.[template]?.destination ||
			config?.destination ||
			'src/modules'
		:	'src/modules';

	const destination =
		/** @type {string} */ (argv.destination) || (await getSourcePath(dest));
	config.destination = destination;

	const tpl = config.templates?.[template ?? ''];

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
		config.defaultTemplate = template;
	}

	await generateModule(moduleName, config);

	config.hooks?.onComplete?.(moduleName);
}

createModule().catch(console.dir);
