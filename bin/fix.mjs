#!/usr/bin/env node
// bin/fix.mjs

// @ts-check

import { intro, outro, spinner } from '@clack/prompts';
import chalk from 'chalk';
import { execa } from 'execa';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { globby } from 'globby';
import { roundNumber } from 'nhb-toolbox';
import path from 'path';
import process from 'process';

import { loadUserConfig } from '../lib/config-loader.mjs';
import { detectPackageManager } from '../lib/detect-package-manager.mjs';
import { STANDARD_ESLINT_CONFIG } from '../templates/eslint-boilerplate.mjs';

/** @typedef {import('type-fest').PackageJson} PackageJson */

/**
 * Check if all required ESLint deps are listed in package.json
 * @returns {string[]} array of missing packages
 */
function checkEslintDeps() {
	/** @type {PackageJson} */
	let pkg;
	try {
		pkg = JSON.parse(
			readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8'),
		);
	} catch {
		return ['package.json not found or unreadable in ' + process.cwd()];
	}

	const allDeps = {
		...pkg.dependencies,
		...pkg.devDependencies,
	};

	const required = [
		'eslint',
		'@eslint/js',
		'@typescript-eslint/eslint-plugin',
		'@typescript-eslint/parser',
		'eslint-config-prettier',
		'eslint-plugin-prettier',
		'globals',
		'typescript-eslint',
	];

	return required.filter((dep) => !allDeps[dep]);
}

/** * Ensure an eslint config file exists or scaffold a default one */
async function ensureEslintConfig() {
	const cwd = process.cwd();
	const configPaths = [
		'eslint.config.js',
		'eslint.config.cjs',
		'eslint.config.mjs',
		'.eslintrc.js',
		'.eslintrc.cjs',
		'.eslintrc.mjs',
	];
	const existingConfigPath = configPaths.find((filename) =>
		existsSync(path.resolve(cwd, filename)),
	);

	if (existingConfigPath) {
		return existingConfigPath;
	}

	const targetConfigPath = path.resolve(cwd, 'eslint.config.mjs');
	writeFileSync(targetConfigPath, STANDARD_ESLINT_CONFIG, 'utf-8');
	console.log(chalk.yellow('⚙️ Created default "eslint.config.mjs"'));
	return 'eslint.config.mjs';
}

(async () => {
	intro(chalk.cyan('🚀 Run ESLint Linter'));
	const startTime = performance.now();

	const missingDeps = checkEslintDeps();
	if (missingDeps.length > 0) {
		const pm = detectPackageManager();

		const installCmd =
			pm === 'npm' ? `npm i -D ${missingDeps.join(' ')}`
			: pm === 'bun' ? `bun add -d ${missingDeps.join(' ')}`
			: `${pm} add -D ${missingDeps.join(' ')}`;

		console.error(
			chalk.red('❌ Missing required ESLint dependencies:'),
			chalk.yellow(missingDeps.join(', ')),
		);
		console.error(chalk.red(`👉 Please install them:\n   ${installCmd}`));
		process.exit(0);
	}

	try {
		const configFile = await ensureEslintConfig();

		const userConfig = (await loadUserConfig()).lint ?? {};
		const folders = userConfig.folders ?? ['src'];
		const patterns = userConfig.patterns ?? ['**/*.ts'];

		// Build glob patterns for counting files
		const globbyPatterns = folders
			.map((folder) => patterns.map((p) => `${folder}/${p}`))
			.flat();

		const files = await globby(globbyPatterns);

		const args = ['eslint', ...folders, '--fix', '--config', configFile];

		const s = spinner();
		s.start(chalk.magenta(`Linting Your Code in ${folders.join(', ')}`));

		await execa('npx', args, { stdio: 'inherit', reject: false });

		const totalFiles = files.length;
		const endTime = performance.now();
		const lintTime = roundNumber((endTime - startTime) / 1000);

		s.stop(
			chalk.green(
				`✓ Scanned total ${chalk.blueBright.bold(totalFiles)} in ${chalk.blueBright.bold(
					lintTime,
				)} seconds!`,
			),
		);

		outro(chalk.green(`🎉 Linting completed in folders: ${folders.join(', ')}`));
	} catch (err) {
		outro(chalk.red('❌ ESLint run failed!'));
		console.error(err);
		process.exit(0);
	}
})();
