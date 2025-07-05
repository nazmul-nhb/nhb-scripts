// @ts-check

import chalk from 'chalk';
import { execa } from 'execa';
import { existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { loadUserConfig } from './config-loader.mjs';
import { estimator } from './estimator.mjs';

import { readFileSync } from 'fs';
import process from 'process';

/** @typedef {import('type-fest').PackageJson} PackageJson */

/**
 * Check if prettier is listed in deps/devDeps
 * @returns {boolean}
 */
function isPrettierInstalled() {
	try {
		/** @type {PackageJson} */
		const pkg = JSON.parse(
			readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8'),
		);

		return Boolean(
			(pkg.dependencies && pkg.dependencies.prettier) ||
				(pkg.devDependencies && pkg.devDependencies.prettier),
		);
	} catch {
		return false;
	}
}

/**
 * @typedef {Object} PrettierConfig
 * @property {string[]} [args]
 * @property {string[]} [files]
 * @property {string} [ignorePath]
 */

const candidates = /* @__PURE__ */ Object.freeze([
	'nhb.format.config.mjs',
	'nhb.format.config.js',
]);

/** * Ensure .prettierrc.json and .prettierignore exist or scaffold */
export async function ensurePrettierFiles() {
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
					useTabs: true,
					experimentalTernaries: true,
				},
				null,
				2,
			),
		);
		console.log(chalk.gray('📝 Created default .prettierrc.json'));
	}

	if (!existsSync(ignorePath)) {
		await fs.writeFile(
			ignorePath,
			`node_modules\ndist\ncoverage\n.estimator\n__*__\n*.md`,
			'utf-8',
		);
		console.log(chalk.gray('📝 Created default .prettierignore'));
	}
}

/**
 * Run prettier formatter
 * @returns {Promise<void>}
 */
export async function runFormatter() {
	await ensurePrettierFiles();
	const config = await /** @type {Promise<PrettierConfig>} */ (
		loadUserConfig(candidates)
	);

	if (!isPrettierInstalled()) {
		console.error(
			chalk.red(
				'❌ Prettier not listed in package.json. Please install `prettier`.',
			),
		);
		process.exit(1);
	}

	const args = [...(config.args ?? ['--write']), ...(config.files ?? ['.'])];

	if (config.ignorePath) {
		args.push('--ignore-path', config.ignorePath);
	}

	console.log(chalk.magenta('🎨 Running Prettier...'));

	await estimator(
		execa('prettier', [...args], { stdio: 'inherit' }),
		chalk.magenta('Formatting in progress...'),
	);

	console.log(chalk.green('✅ Prettier formatting complete!'));
}
