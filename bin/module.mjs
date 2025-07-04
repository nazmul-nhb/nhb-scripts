#!/usr/bin/env node
// bin/module.mjs

// @ts-check

import readline from 'readline/promises';
import chalk from 'chalk';
import { loadUserConfig } from '../lib/config-loader.mjs';
import { generateModule } from '../lib/module-generator.mjs';

async function createModule() {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	const moduleName = await rl.question(chalk.cyan('Enter module name: '));
	const config = await loadUserConfig();

	config.hooks?.onGenerate?.(moduleName);
	await generateModule(moduleName, config);

	rl.close();
}

createModule();
