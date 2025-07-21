#!/usr/bin/env node
// bin/fix.mjs

// @ts-check

import { intro, note, outro, spinner } from '@clack/prompts';
import chalk from 'chalk';
import { execa } from 'execa';
import { globby } from 'globby';
import { roundNumber } from 'nhb-toolbox';
import process from 'process';

import { loadUserConfig } from '../lib/config-loader.mjs';
import { checkEslintDeps, ensureEslintConfig } from '../lib/lint-helpers.mjs';

(async () => {
	intro(chalk.cyan.bold('🚀 Run ESLint Fixer'));
	const startTime = performance.now();

	checkEslintDeps();

	try {
		const configFile = await ensureEslintConfig();

		const userConfig = (await loadUserConfig()).fix ?? {};
		const folders = userConfig.folders ?? ['src'];
		const patterns = userConfig.patterns ?? ['**/*.ts'];

		// Build glob patterns for counting files
		const globbyPatterns = folders
			.map((folder) => patterns.map((p) => `${folder}/${p}`))
			.flat();

		const files = await globby(globbyPatterns);

		const s = spinner();
		s.start(chalk.magenta(`Fixing Your Code in ${folders.join(', ')}`));

		const { stdout, stderr } = await execa(
			'eslint',
			[...folders, '--fix', '--config', configFile],
			{ reject: false },
		);

		const fixOut = (stdout + '\n' + stderr)?.trim();

		if (fixOut) {
			const lines = fixOut
				?.split('\n')
				.filter(Boolean)
				.map((line) => chalk.cyan('• ') + line?.trim())
				.join('\n');

			note(lines, chalk.magenta('✓ Fix Summary'));
		}

		const totalFiles = files.length;
		const endTime = performance.now();
		const lintTime = roundNumber((endTime - startTime) / 1000);

		s.stop(
			chalk.green(
				`✓ Scanned total ${chalk.blueBright.bold(totalFiles)} files in ${chalk.blueBright.bold(
					lintTime,
				)} seconds!`,
			),
		);

		outro(chalk.green(`🎉 Fixing completed in folders: ${folders.join(', ')}`));
	} catch (err) {
		outro(chalk.red('🛑 ESLint run failed!'));
		console.error(err);
		process.exit(0);
	}
})();
