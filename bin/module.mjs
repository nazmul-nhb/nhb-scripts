#!/usr/bin/env node
// bin/module.mjs

// @ts-check

import chalk from 'chalk';
import { existsSync } from 'fs';
import { writeFile } from 'fs/promises';
import minimist from 'minimist';
import path from 'path';
import prompts from 'prompts';
import { loadUserConfig } from '../lib/config-loader.mjs';
import { generateModule } from '../lib/module-generator.mjs';

/**
 * @typedef {import('../types/define-module-config.d.ts').ModuleConfig['template']} ModuleName
 */

const argv = minimist(process.argv.slice(2), {
	string: ['template', 'name', 'destination'],
	boolean: ['force'],
	alias: {
		t: 'template',
		n: 'name',
		f: 'force',
		d: 'destination'
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
 * Get source path for the module
 * @param {string} defaultPath 
 *  @return {Promise<string>} 
 */
const getSourcePath = async (defaultPath) => {
	return (
		await prompts({
			type: 'text',
			name: 'value',
			message: chalk.cyan(`Enter a source path (Default is ${defaultPath || 'src/app/module'}):`),
		})
	).value || defaultPath;
}

/** * Ensure config file exists or scaffold it if missing */
async function ensureUserConfigFile() {
	const root = process.cwd();
	const candidates = ['nhb.module.config.mjs', 'nhb.module.config.js'];

	const found = candidates.find(name => existsSync(path.join(root, name)));

	if (found) return;

	const { value: shouldCreate } = await prompts({
		type: 'confirm',
		name: 'value',
		message: chalk.yellow(`⚙️  No configuration file detected! Want to create one?`),
		initial: false,
	});

	if (!shouldCreate) {
		console.log(chalk.gray('  ⛔ Proceeding with default settings without custom configuration file!'));
		return;
	}

	const filePath = path.join(root, 'nhb.module.config.mjs');

	const boilerplate = `// @ts-check

import { defineModuleConfig } from 'nhb-scripts';

export default defineModuleConfig({
	destination: 'src/app/modules', // optional, default: "src/app/modules"
	template: 'my-template1', // or omit, it's not necessary as cli will prompt to choose
	force: false, // true if you want to override the existing module
	customTemplates: {
		'my-template1': {
			destination: 'src/app', // optional, will prioritize inputs from cli
			files: [
				{ name: 'index.ts', content: '// index' },
				{ name: 'server.ts', content: '// server' }]
		},
		'my-template2': {
			destination: 'src/features', // optional, will prioritize inputs from cli
			files: [
				{ name: 'index.ts', content: '// content' },
				{ name: 'dummy.js', content: '// dummy' }
			]
		},
	},
	// Optional hooks to inspect or execute something at the beginning or after the module generation
	hooks: {
		onGenerate(name) {
			console.log('Generating', name);
		},
		onComplete(name) {
			console.log('Complete:', name);
		}
	}
});
`;

	await writeFile(filePath, boilerplate, 'utf-8');
	console.log(`📝 Created ${path.relative(root, filePath)} for you.`);
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
	await ensureUserConfigFile();
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
	const template = argv.template || await getTemplateFromPrompt([...builtInTemplates, ...customTemplates,]);

	/** @returns {string}*/
	const dest = template
		? (config.customTemplates?.[template]?.destination ?? config?.destination ?? 'src/app/modules')
		: 'src/app/modules'


	/** @type {string} */
	const destination = argv.destination ?? await getSourcePath(dest)

	console.log(destination);

	config.destination = destination

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
}

createModule();
