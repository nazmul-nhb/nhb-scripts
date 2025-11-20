#!/usr/bin/env node
// bin/build.mjs

// @ts-check

import { intro, note, outro } from '@clack/prompts';
import chalk from 'chalk';
import { execa } from 'execa';
import { globby } from 'globby';
import { isValidArray, roundNumber } from 'nhb-toolbox';
import { extname } from 'node:path';
import { rimraf } from 'rimraf';
import { addPipeOnLeft, mimicClack } from '../lib/clack-utils.mjs';
import { loadUserConfig } from '../lib/config-loader.mjs';
import { estimator } from '../lib/estimator.mjs';

/**
 * @import { BuildCommand } from '../types/index.d.ts';
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
	intro(chalk.yellowBright.bold('📦 NHB Build'));
	console.info(addPipeOnLeft());

	const {
		after = [],
		commands: cmds = [],
		deleteDist = true,
		distFolder = 'dist',
		waitingMessage = ' 📦 Building Your Application...',
		showOutputs = false,
	} = (await loadUserConfig()).build ?? {};

	/** @type {BuildCommand[]} */
	const defaultCommands = [{ cmd: 'tsc', options: { stdio: 'inherit' } }];

	const commands = isValidArray(cmds) ? cmds : defaultCommands;

	const startTime = performance.now();

	try {
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
			chalk.yellowBright(waitingMessage)
		);

		// Gather Transformed Files
		const outputFiles = await globby([`${distFolder}/**/*`], {
			stats: true,
			objectMode: true,
		});

		let totalSize = 0;

		const rows = outputFiles.map(({ path, stats }) => {
			const sizeInKB = (stats?.size || 0) / 1024;

			totalSize += sizeInKB;

			const fileIcon = getFileIcon(path);

			return [
				chalk.yellow(`${fileIcon} ${path}`),
				chalk.cyan(`${roundNumber(sizeInKB)} kB`),
			];
		});

		if (showOutputs) {
			const lines = rows
				.map(([left, right]) => `${chalk.cyan('•')} ${left.padEnd(80)}${right}`)
				.join('\n');

			// Log Transformed Files
			note(lines, chalk.green('✓ Transformed Files'));
		}

		// Log Total Size and Build Time
		const totalSizeInKB = roundNumber(totalSize);

		const totalFiles = `Total Files: ${chalk.blueBright.bold(outputFiles.length)}`;

		const totalFileSize = `Total Size: ${chalk.blueBright.bold(totalSizeInKB)} kB`;

		mimicClack(chalk.green(`📂 ${totalFiles}; ${totalFileSize}`));

		if (Array.isArray(after)) {
			for (const afterHook of after) {
				await afterHook();
			}
		}

		const endTime = performance.now();

		const buildTime = roundNumber((endTime - startTime) / 1000);

		outro(
			chalk.green(
				`📦 Application was built in ${chalk.blueBright.bold(buildTime)} seconds!`
			)
		);
	} catch (error) {
		console.error(chalk.red('🛑 Build Failed!'), error);
		process.exit(0);
	}
})();
