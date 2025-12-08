// @ts-check

import { intro, log, outro } from '@clack/prompts';
import chalk from 'chalk';
import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { cwd } from 'node:process';
import { pathToFileURL } from 'node:url';
import { CONFIG_BOILERPLATE } from '../templates/config-boilerplate.mjs';
import { spinner } from '@clack/prompts';

/** @import { ScriptConfig } from'../types/index.d.ts' */

/** Config file candidates */
const candidates = /* @__PURE__ */ Object.freeze([
	'nhb.scripts.config.mjs',
	'nhb.scripts.config.js',
]);

/**
 *
 * @param {string} file
 */
function _flatFileName(file) {
	return file.slice(file.indexOf('nhb.scripts.config'));
}

/** Create new config file if it doesn't exist in the working directory and return the file name. */
export function initConfigFile() {
	intro(chalk.yellowBright(`⚙️  Looking for config file...`));

	const root = cwd();

	let file = candidates.map((name) => path.join(root, name)).find(existsSync);

	if (file) {
		outro(chalk.green(`✓ Found '${_flatFileName(file)}'!`));
	}

	if (!file) {
		const s = spinner();

		s.start(chalk.yellowBright(`⚙️  Creating config file: '${candidates[0]}'...`));

		const filePath = path.join(root, `${candidates[0]}`);
		writeFileSync(filePath, CONFIG_BOILERPLATE, 'utf-8');

		s.stop(chalk.green(`✓ Successfully created '${_flatFileName(filePath)}'!`));
		outro(chalk.green(`✓ Loaded configs from '${_flatFileName(filePath)}'!`));

		file = filePath;
	}

	return file;
}

/**
 * * Load user-defined config file if present, otherwise create a config file.
 * @returns {Promise<ScriptConfig>} User-defined configs.
 */
export async function loadUserConfig() {
	const configModule = await import(pathToFileURL(initConfigFile()).href);
	return /** @type {ScriptConfig} */ (configModule.default || configModule);
}
