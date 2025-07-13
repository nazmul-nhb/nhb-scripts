#!/usr/bin/env node
// bin/module.mjs

// @ts-check

import chalk from 'chalk';
import { existsSync } from 'fs';
import { writeFile } from 'fs/promises';
import minimist from 'minimist';
import path from 'path';
import Enquirer from 'enquirer';
import { loadUserConfig } from '../lib/config-loader.mjs';
import { generateModule } from '../lib/module-generator.mjs';
import { moduleConfigBoilerplate } from '../templates/module-config-boilerplate.mjs';

/**
 * @typedef {import('../types/define-configs').ModuleConfig} ModuleConfig
 */

/**
 * @typedef {ModuleConfig['template']} ModuleName
 */

const enquirer = new Enquirer();

const candidates = /** @type {const} */ (['nhb.module.config.mjs', 'nhb.module.config.js']);

const argv = minimist(process.argv.slice(2), {
	string: ['template', 'name', 'destination'],
	boolean: ['force'],
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

/**
 * Prompt user for module name
 * @returns {Promise<string>}
 */
const getModuleNameFromPrompt = async () => {
	try {
		const result = /** @type {{ value: string }} */ (
			await enquirer.prompt({
				type: 'input',
				name: 'value',
				message: chalk.cyan('Enter module name:'),
				validate: (val) => (val ? true : 'Module name is required!'),
			})
		);
		return result.value;
	} catch {
		console.log(chalk.gray('⛔ Process cancelled by user!'));
		process.exit(0);
	}
};

/**
 * Prompt user for source path
 * @param {string} defaultPath
 * @returns {Promise<string>}
 */
const getSourcePath = async (defaultPath) => {
	try {
		const result = /** @type {{ value: string }} */ (
			await enquirer.prompt({
				type: 'input',
				name: 'value',
				message: chalk.cyan(
					`Enter a source path (Default is ${defaultPath || 'src/app/module'}):`,
				),
			})
		);
		return result.value || defaultPath;
	} catch {
		console.log(chalk.gray('⛔ Process cancelled by user!'));
		process.exit(0);
	}
};

/**
 * Ensure nhb.module.config file exists, optionally generate one
 */
async function ensureUserConfigFile() {
	const root = process.cwd();
	const found = candidates.find((name) => existsSync(path.join(root, name)));
	if (found) return;

	try {
		const result = /** @type {{ value: boolean }} */ (
			await enquirer.prompt({
				type: 'confirm',
				name: 'value',
				message: chalk.yellow(
					`⚙️  No 'nhb.module.config.mjs' file detected! Want to create one?`,
				),
				initial: false,
			})
		);

		if (!result.value) {
			console.log(
				chalk.gray(
					'  ⛔ Proceeding with default settings without custom configuration file!',
				),
			);
			return;
		}

		const filePath = path.join(root, 'nhb.module.config.mjs');
		await writeFile(filePath, moduleConfigBoilerplate, 'utf-8');
		console.log(`📝 Created ${path.relative(root, filePath)} for you.`);
	} catch {
		console.log(chalk.gray('⛔ Process cancelled by user!'));
		process.exit(0);
	}
}

/**
 * Prompt to select a template
 * @param {Array<{title: string, value: ModuleName}>} choices
 * @returns {Promise<ModuleName>}
 */
const getTemplateFromPrompt = async (choices) => {
	try {
		const result = /** @type {{ value: ModuleName }} */ (
			await enquirer.prompt({
				type: 'select',
				name: 'value',
				message: chalk.magenta('Choose a module template'),
				choices: choices.map((c) => ({
					name: /** @type {string} */ (c.value),
					message: c.title,
				})),
			})
		);
		return result.value;
	} catch {
		console.log(chalk.gray('⛔ Process cancelled by user!'));
		process.exit(0);
	}
};

/**
 * Prompt to confirm folder creation
 * @param {string} moduleName
 * @returns {Promise<boolean>}
 */
const askCreateFolder = async (moduleName) => {
	try {
		const result = /** @type {{ value: boolean }} */ (
			await enquirer.prompt({
				type: 'confirm',
				name: 'value',
				message: chalk.blueBright(
					`Do you want to generate files inside a folder named "${moduleName}"?`,
				),
				initial: true,
			})
		);
		return result.value;
	} catch {
		console.log(chalk.gray('⛔ Process cancelled by user!'));
		process.exit(0);
	}
};

/**
 * Prompt to confirm overwrite
 * @param {string} modulePath
 * @returns {Promise<boolean>}
 */
const askOverwrite = async (modulePath) => {
	try {
		const result = /** @type {{ value: boolean }} */ (
			await enquirer.prompt({
				type: 'confirm',
				name: 'value',
				message: chalk.yellow(
					`Files in "${modulePath}" already exist. Overwrite conflicting files/folders?`,
				),
				initial: false,
			})
		);
		return result.value;
	} catch {
		console.log(chalk.gray('⛔ Module generation cancelled by user!'));
		process.exit(0);
	}
};

/** Create a module */
async function createModule() {
	await ensureUserConfigFile();

	const config = await /** @type {Promise<ModuleConfig>} */ (loadUserConfig(candidates));

	/** @type {Array<{title: string, value: ModuleName}>} */
	const customTemplates = Object.keys(config?.customTemplates || {}).map((key) => ({
		title: `🧩 Custom: ${key}`,
		/** @type {ModuleName} */
		value: key,
	}));

	/** @type {Array<{title: string, value: ModuleName}>} */
	const builtInTemplates = [
		{ title: 'Express + Mongoose + Zod', value: 'express-mongoose-zod' },
	];

	const moduleName = argv.name || (await getModuleNameFromPrompt());

	if (!moduleName) {
		console.error(chalk.red('🛑 Module name is required!'));
		process.exit(0);
	}

	const template =
		argv.template ||
		(await getTemplateFromPrompt([...builtInTemplates, ...customTemplates]));

	const dest =
		template ?
			config.customTemplates?.[template]?.destination ||
			config?.destination ||
			'src/app/modules'
		:	'src/app/modules';

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
			console.log(chalk.gray('⛔ Module generation cancelled by user!'));
			process.exit(0);
		}
		config.force = true;
	} else {
		config.force = argv.force || false;
	}

	config.hooks?.onGenerate?.(moduleName);

	if (template) {
		config.template = template;
	}

	await generateModule(moduleName, config);

	config.hooks?.onComplete?.(moduleName);
}

createModule();
