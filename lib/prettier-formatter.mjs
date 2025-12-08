// @ts-check

import { note, spinner } from '@clack/prompts';
import chalk from 'chalk';
import { execa } from 'execa';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { mimicClack, showCancelMessage } from './clack-utils.mjs';
import { loadUserConfig } from './config-loader.mjs';
import { detectPackageManager } from './detect-package-manager.mjs';
import { parsePackageJson } from './package-json-utils.mjs';

/**
 * Check if prettier is listed in deps/devDeps
 * @returns {boolean}
 */
function isPrettierInstalled() {
	try {
		const pkg = parsePackageJson();

		return Boolean(
			(pkg.dependencies && pkg.dependencies.prettier) ||
			(pkg.devDependencies && pkg.devDependencies.prettier)
		);
	} catch {
		return false;
	}
}

/** * Ensure `.prettierrc.json` and `.prettierignore` exist or scaffold */
async function ensurePrettierFiles() {
	const cwd = process.cwd();
	const rcPath = path.join(cwd, '.prettierrc.json');
	const ignorePath = path.join(cwd, '.prettierignore');

	if (!existsSync(rcPath)) {
		await fs.writeFile(
			rcPath,
			JSON.stringify(
				{
					semi: true,
					singleQuote: true,
					tabWidth: 4,
					printWidth: 96,
					useTabs: true,
					trailingComma: 'es5',
					experimentalTernaries: true,
				},
				null,
				2
			)
		);
		mimicClack(chalk.gray('⚙️  Created default ".prettierrc.json"'));
	}

	if (!existsSync(ignorePath)) {
		await fs.writeFile(
			ignorePath,
			`node_modules\ndist\ncoverage\n.estimator\n__*__\n*.md`,
			'utf-8'
		);
		mimicClack(chalk.gray('⚙️  Created default ".prettierignore"'));
	}
}

/** * Run prettier formatter */
export async function runFormatter() {
	await ensurePrettierFiles();

	const config = (await loadUserConfig()).format ?? {};

	if (!isPrettierInstalled()) {
		const pm = detectPackageManager();

		const installCmd =
			pm === 'npm' ? `npm i -D prettier`
			: pm === 'bun' ? `bun add -d prettier`
			: `${pm} add -D prettier`;

		showCancelMessage(
			`🛑 Prettier not listed in package.json. Please install: ${installCmd}`
		);
	}

	const args = [...(config.args || ['--write']), ...(config.files || ['.'])];

	if (config.ignorePath) {
		args.push('--ignore-path', config.ignorePath);
	}

	const s = spinner();

	try {
		s.start(chalk.magenta('🎨 Running Prettier'));

		const { stdout } = await execa('prettier', args);

		s.stop(chalk.green('✓ Prettier formatting complete!'));

		if (stdout?.trim()) {
			const lines = stdout
				.split('\n')
				.filter(Boolean)
				.map((line) => chalk.cyan('• ') + line)
				.join('\n');

			note(lines, chalk.magenta('✓ Files Processed'));
		}
	} catch (err) {
		s.stop(chalk.red('🛑 Prettier run failed!'));
		console.error(err);
		process.exit(0);
	}
}
