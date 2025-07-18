// @ts-check

import chalk from 'chalk';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { STANDARD_ESLINT_CONFIG } from '../templates/eslint-boilerplate.mjs';
import { detectPackageManager } from './detect-package-manager.mjs';
import { parsePackageJson } from './package-json-utils.mjs';

const configPaths = /* @__PURE__ */ Object.freeze([
	'eslint.config.js',
	'eslint.config.cjs',
	'eslint.config.mjs',
	'.eslintrc.js',
	'.eslintrc.cjs',
	'.eslintrc.mjs',
]);

/** * Check if all required ESLint deps are listed in package.json */
export function checkEslintDeps() {
	const cwd = process.cwd();

	const hasCustomConfig = configPaths.some((filename) =>
		existsSync(path.resolve(cwd, filename)),
	);

	if (hasCustomConfig) return;

	const pkg = parsePackageJson();

	const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

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
