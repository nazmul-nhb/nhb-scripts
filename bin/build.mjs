#!/usr/bin/env node
// bin/build.mjs

// @ts-check

import { intro, outro, spinner } from '@clack/prompts';
import chalk from 'chalk';
import { execa } from 'execa';
import { globby } from 'globby';
import { isValidArray, roundNumber } from 'nhb-toolbox';
import { extname } from 'path';
import { loadUserConfig } from '../lib/config-loader.mjs';
import { estimator } from '../lib/estimator.mjs';
import { rimraf } from 'rimraf';

/**
 * @typedef {import('execa').Result} Result
 * @typedef {import('../types/index.d.ts').BuildCommand} BuildCommand
 */

/**
 * * Get the icon for the file.
 * @param {string} filePath - The path of the file.
 * @returns {string} - The icon for the file.
 */
const getFileIcon = (filePath) => {
	switch (extname(filePath)) {
		case '.js':
			return '🟨';
		case '.ts':
			return '🟦';
		case '.map':
			return '🟩';
		default:
			return '🗃️ ';
	}
};

(async () => {
	intro(chalk.yellowBright('📦 Build Your Application'));

	const {
		after = [],
		commands: cmds = [],
		deleteDist = true,
		distFolder = 'dist',
	} = (await loadUserConfig()).build ?? {};

	/** @type {BuildCommand[]} */
	const defaultCommands = [{ cmd: 'tsc', options: { stdio: 'inherit' } }];

	const commands = isValidArray(cmds) ? cmds : defaultCommands;

	const startTime = performance.now();

	try {
		const s = spinner();
		s.start(chalk.yellowBright('Building'));

		await estimator(
			(async () => {
				if (deleteDist) {
					await rimraf(distFolder);
				}

				for (const command of commands) {
					const { cmd, args = [], options = {} } = command;
					await execa(cmd, args, { cwd: process.cwd(), ...options });
				}
			})(),
			chalk.yellowBright('Building Your Application...'),
		);

		// Gather Transformed Files
		const outputFiles = await globby([`${distFolder}/**/*`], {
			stats: true,
			objectMode: true,
		});

		// Log Transformed Files
		console.info(chalk.green('\n✓ Transformed Files:'));

		let totalSize = 0;

		const rows = outputFiles.map(({ path, stats }) => {
			const sizeInKB = (stats?.size || 0) / 1024;

			totalSize += sizeInKB;

			const fileIcon = getFileIcon(path);

			return [
				chalk.yellow(`${fileIcon} ${path}`),
				chalk.cyan(`${sizeInKB.toFixed(2)} kB`),
			];
		});

		const columnWidth = 80;

		rows.forEach(([left, right]) => {
			console.info(`${left.padEnd(columnWidth)}${right}`);
		});

		// Log Total Size and Build Time
		const totalSizeInKB = totalSize.toFixed(2);

		const totalFiles = `Total Files: ${chalk.blueBright.bold(outputFiles.length)}`;

		const totalFileSize = `Total Size: ${chalk.blueBright.bold(totalSizeInKB)} kB`;

		s.stop(chalk.green(`✓ ${totalFiles}; ${totalFileSize}`));

		if (Array.isArray(after)) {
			for (const afterHook of after) {
				await afterHook();
			}
		}

		const endTime = performance.now();

		const buildTime = roundNumber((endTime - startTime) / 1000);

		outro(
			chalk.green(
				`📦 Application was built in ${chalk.blueBright.bold(buildTime)} seconds!`,
			),
		);
	} catch (error) {
		console.error(chalk.red('🛑 Build Failed!'), error);
		process.exit(1);
	}
})();
