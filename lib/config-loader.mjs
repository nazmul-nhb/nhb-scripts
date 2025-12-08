// @ts-check

import { intro, outro } from '@clack/prompts';
import chalk from 'chalk';
import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { cwd } from 'node:process';
import { pathToFileURL } from 'node:url';
import { CONFIG_BOILERPLATE } from '../templates/config-boilerplate.mjs';

/** @import { ScriptConfig } from'../types/index.d.ts' */

const candidates = /* @__PURE__ */ Object.freeze([
	'nhb.scripts.config.mjs',
	'nhb.scripts.config.js',
]);

/** Check and create new config file if it doesn't exist and return the file name. */
export function checkAndCreateConfig() {
	const root = cwd();
	let file = candidates.map((name) => path.join(root, name)).find(existsSync);

	if (!file) {
		intro(
			chalk.yellowBright(`⚙️  No config file found! Creating 'nhb.scripts.config.mjs'...`)
		);
		const filePath = path.join(root, 'nhb.scripts.config.mjs');
		writeFileSync(filePath, CONFIG_BOILERPLATE, 'utf-8');
		outro(chalk.green(`✓ Successfully created ${filePath}`));

		file = filePath;
	}

	return file;
}

/**
 * * Load user-defined config file if present, otherwise create a config file.
 * @returns {Promise<ScriptConfig>} User-defined configs.
 */
export async function loadUserConfig() {
	const configModule = await import(pathToFileURL(checkAndCreateConfig()).href);
	return /** @type {ScriptConfig} */ (configModule.default || configModule);
}
