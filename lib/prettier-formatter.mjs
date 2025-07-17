// @ts-check

import chalk from 'chalk';
import { execa } from 'execa';
import { existsSync, readFileSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import process from 'process';

import { intro, outro, spinner } from '@clack/prompts';
import { loadUserConfig } from './config-loader.mjs';

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

/** * Run prettier formatter */
export async function runFormatter() {
	intro(chalk.cyan('🚀 Run Prettier Formatter'));

	await ensurePrettierFiles();

	const config = (await loadUserConfig()).format ?? {};

	if (!isPrettierInstalled()) {
		console.error(
			chalk.red('❌ Prettier not listed in package.json. Please install `prettier`.'),
		);
		process.exit(0);
	}

	const args = [...(config.args || ['--write']), ...(config.files || ['.'])];

	if (config.ignorePath) {
		args.push('--ignore-path', config.ignorePath);
	}

	const s = spinner();

	s.start(chalk.magenta('🎨 Running Prettier...'));

	try {
		const { stdout } = await execa('prettier', args);

		s.stop(chalk.green('✅ Prettier formatting complete!'));

		if (stdout.trim()) {
			const lines = stdout.split('\n').filter(Boolean);
			console.log(chalk.gray('── Files processed: ──'));
			for (const line of lines) {
				console.log('  ' + chalk.cyan('• ') + chalk.white(line));
			}
		}

		outro(chalk.green('🎉 Successfully Formatted!'));
	} catch (err) {
		s.stop(chalk.red('❌ Prettier run failed!'));
		console.error(err);
		process.exit(0);
	}
}
