// @ts-check

import { spinner } from '@clack/prompts';
import chalk from 'chalk';
import fs from 'fs/promises';
import { join, resolve } from 'path';

/**
 * * Fix `.ts` extensions in `ESM` files.
 * @param {string} dir - Directory to fix
 * @param {boolean} [isRoot=true] - Internal flag to show spinner only once
 */
export const fixTsExtensions = async (dir, isRoot = true) => {
	const resolvedDir = resolve(process.cwd(), dir);

	const s = spinner();

	if (isRoot) {
		s.start(chalk.cyanBright(`🔎 Scanning: ${resolvedDir}`));
	}

	const entries = await fs.readdir(resolvedDir, { withFileTypes: true });

	for (const entry of entries) {
		try {
			const fullPath = join(resolvedDir, entry.name);

			if (entry.isDirectory()) {
				await fixTsExtensions(fullPath, false);
			} else if (entry.isFile() && entry.name.endsWith('.ts')) {
				const code = await fs.readFile(fullPath, 'utf8');

				// Replace relative imports/exports that don’t end with .ts/.json
				const fixed = code.replace(
					/(?<=\b(?:import|export)[^'"]*?from\s*['"])(\.{1,2}\/[^'"]+?)(?=(?<!\.ts|\.json)['"])/g,
					'$1.ts'
				);

				await fs.writeFile(fullPath, fixed);
			}
		} catch (error) {
			console.error('Error in Fixing Import Statements:', error);
		}
	}

	if (isRoot) {
		s.stop(
			chalk.greenBright(
				`✓ Appended ${chalk.yellowBright('*.ts')} in ESM import statements!`
			)
		);
	}
};

/**
 * * Fix `.js` extensions in `ESM` files.
 * @param {string} dir - Directory to fix
 * @param {boolean} [isRoot=true] - Internal flag to show spinner only once
 */
export const fixJsExtensions = async (dir, isRoot = true) => {
	const resolvedDir = resolve(process.cwd(), dir);

	const s = spinner();

	if (isRoot) {
		s.start(chalk.cyanBright(`🔎 Scanning: ${resolvedDir}`));
	}

	const entries = await fs.readdir(resolvedDir, { withFileTypes: true });

	for (const entry of entries) {
		try {
			const fullPath = join(resolvedDir, entry.name);

			if (entry.isDirectory()) {
				await fixJsExtensions(fullPath, false);
			} else if (entry.isFile() && entry.name.endsWith('.js')) {
				const code = await fs.readFile(fullPath, 'utf8');

				// Replace relative imports/exports that don’t end with .js/.json/.mjs
				const fixed = code.replace(
					/(?<=\b(?:import|export)[^'"]*?from\s*['"])(\.{1,2}\/[^'"]+?)(?=(?<!\.m?js|\.json)['"])/g,
					'$1.js'
				);

				await fs.writeFile(fullPath, fixed);
			}
		} catch (error) {
			console.error('Error in Fixing Import Statements:', error);
		}
	}

	if (isRoot) {
		s.stop(
			chalk.greenBright(
				`✓ Appended ${chalk.yellowBright('*.js')} in ESM import statements!`
			)
		);
	}
};
