// @ts-check

/** @typedef {import('type-fest').PackageJson} PackageJson */

import chalk from 'chalk';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { STANDARD_ESLINT_CONFIG } from '../templates/eslint-boilerplate.mjs';
import { detectPackageManager } from './detect-package-manager.mjs';

/** * Check if all required ESLint deps are listed in package.json */
export function checkEslintDeps() {
	/** @type {PackageJson} */
	let pkg;

	try {
		pkg = JSON.parse(
			readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8'),
		);
	} catch (error) {
		console.error(
			chalk.red('package.json not found or unreadable in ' + process.cwd()),
		);
		console.error(error);
		process.exit(0);
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

	const missingDeps = required.filter((dep) => !allDeps[dep]);

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
}

/** * Ensure an eslint config file exists or scaffold a default one */
export async function ensureEslintConfig() {
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
