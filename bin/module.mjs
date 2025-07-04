#!/usr/bin/env node
// bin/module.mjs

// @ts-check

import chalk from 'chalk';
import { existsSync } from 'fs';
import minimist from 'minimist';
import path from 'path';
import prompts from 'prompts';
import readline from 'readline/promises';
import { loadUserConfig } from '../lib/config-loader.mjs';
import { generateModule } from '../lib/module-generator.mjs';

/**
 * @typedef {import('../types/define-module-config.d.ts').ModuleConfig['template']} ModuleName
 */

const argv = minimist(process.argv.slice(2), {
	string: ['template', 'name'],
	boolean: ['force'],
	alias: {
		t: 'template',
		n: 'name',
		f: 'force',
	},
	default: {
		force: false,
	},
});

/** @return {Promise<string>} */
const getModuleNameFromPrompt = async () => {
	return (
		await prompts({
			type: 'text',
			name: 'value',
			message: chalk.cyan('Enter module name:'),
			validate: (value) => (value ? true : 'Module name is required!'),
		})
	).value;
}

/**
 * 
 * @param {Array<{title: string, value: ModuleName}>} choices 
 * @return {Promise<ModuleName>}
 */
const getTemplateFromPrompt = async (choices) => {
	return (
		await prompts({
			type: 'select',
			name: 'value',
			message: chalk.magenta('Choose a module template'),
			choices: choices,
		})
	).value;
}

/** Create a module */
async function createModule() {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	const config = await loadUserConfig();

	/** @type {Array<{title: string, value: ModuleName}>} */
	const customTemplates = Object.keys(config?.customTemplates ?? {}).map((key) => ({
		title: `🧩 Custom: ${key}`,
		value: key	/** @type {ModuleName} */,
	}));

	/** @type {Array<{title: string, value: ModuleName}>} */
	const builtInTemplates = [
		{ title: 'Express + Mongoose + Zod', value: 'express-mongoose-zod' },
	];

	/** @type {string} */
	const moduleName = argv.name || await getModuleNameFromPrompt()

	// await rl.question(chalk.cyan('Enter module name: '));

	if (!moduleName) {
		console.error(chalk.red('🛑 Module name is required!'));
		process.exit(1);
	}

	/** @type {ModuleName} */
	const template = argv.template ?? await getTemplateFromPrompt([...builtInTemplates, ...customTemplates,]);

	const destination = config.destination ?? 'src/app/modules';
	const modulePath = path.resolve(destination, moduleName);

	/** Check if exists, and prompt force */
	if (existsSync(modulePath) && !argv.force && !config.force) {
		const { value: shouldOverwrite } = await prompts({
			type: 'confirm',
			name: 'value',
			message: chalk.yellow(`Module "${moduleName}" already exists. Overwrite?`),
			initial: false,
		});

		if (!shouldOverwrite) {
			console.log(chalk.gray('⛔ Module generation cancelled by user!'));
			process.exit(0);
		}

		config.force = true;
	} else {
		config.force = argv.force ?? false;
	}

	config.hooks?.onGenerate?.(moduleName);

	if (template) {
		config.template = template;
	}

	await generateModule(moduleName, config);

	config.hooks?.onComplete?.(moduleName);

	rl.close();
}

createModule();
