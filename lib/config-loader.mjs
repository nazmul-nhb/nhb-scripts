// @ts-check

import { intro, outro } from '@clack/prompts';
import chalk from 'chalk';
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { cwd } from 'node:process';
import { pathToFileURL } from 'node:url';
import { configBoilerplate } from '../templates/config-boilerplate.mjs';

/** @typedef {import('../types/index.d.ts').ScriptConfig} ScriptConfig */

const candidates = /* @__PURE__ */ Object.freeze([
	'nhb.scripts.config.mjs',
	'nhb.scripts.config.js',
]);

/**
 * * Load user-defined config file if present, otherwise create a config file.
 * @returns {Promise<ScriptConfig>} User-defined configs.
 */
export async function loadUserConfig() {
	const root = cwd();
	let file = candidates.map((name) => path.join(root, name)).find(existsSync);

	if (!file) {
		intro(
			chalk.yellowBright(`⚙️  No config file found! Creating 'nhb.scripts.config.mjs'...`)
		);
		const filePath = path.join(root, 'nhb.scripts.config.mjs');
		await writeFile(filePath, configBoilerplate, 'utf-8');
		outro(chalk.green(`✓ Successfully created ${filePath}`));

		file = filePath;
	}

	const configModule = await import(pathToFileURL(file).href);
	return /** @type {ScriptConfig} */ (configModule.default || configModule);
}
