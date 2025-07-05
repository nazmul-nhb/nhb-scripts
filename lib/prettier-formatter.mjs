// @ts-check

import chalk from 'chalk';
import { execa } from 'execa';
import { existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { loadUserConfig } from './config-loader.mjs';
import { estimator } from './estimator.mjs';

import { readFileSync } from 'fs';
import { writeFile } from 'fs/promises';
import process from 'process';
import prompts from 'prompts';
import { formatConfigBoilerplate } from '../templates/format-config-boilerplate.mjs';

/** @typedef {import('type-fest').PackageJson} PackageJson */

/** @typedef {import('../types/define-configs.d.ts').FormatConfig} FormatConfig */

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
					printWidth: 92,
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

async function ensureFormatConfigFiles() {
	const root = process.cwd();

	const found = candidates.find((name) => existsSync(path.join(root, name)));

	if (found) return;

	const { value: shouldCreate } = await prompts({
		type: 'confirm',
		name: 'value',
		message: chalk.yellow(
			`⚙️  No 'nhb.format.config.mjs' file detected! Want to create one?`,
		),
		initial: false,
	});

	if (!shouldCreate) {
		console.log(
			chalk.gray(
				'  ⛔ Proceeding with default settings without custom configuration file!',
			),
		);
		return;
	}

	const filePath = path.join(root, 'nhb.format.config.mjs');

	await writeFile(filePath, formatConfigBoilerplate, 'utf-8');
	console.log(`📝 Created ${path.relative(root, filePath)} for you.`);
}

/**
 * Run prettier formatter
 * @returns {Promise<void>}
 */
export async function runFormatter() {
	await ensurePrettierFiles();
	await ensureFormatConfigFiles();

	const config = await /** @type {Promise<FormatConfig>} */ (loadUserConfig(candidates));

	if (!isPrettierInstalled()) {
		console.error(
			chalk.red('❌ Prettier not listed in package.json. Please install `prettier`.'),
		);
		process.exit(1);
	}

	const args = [...(config.args || ['--write']), ...(config.files || ['.'])];

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
