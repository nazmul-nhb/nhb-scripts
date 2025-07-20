// @ts-check

import { isCancel, outro } from '@clack/prompts';
import chalk from 'chalk';

/**
 * * Show cancel message with outro and graceful exit
 * @param {string} [message] Optional message to display
 */
export function showCancelMessage(message) {
	outro(chalk.redBright(message || '🛑 Process cancelled by user!'));
	process.exit(0);
}

/**
 * * Normalize clack result to string
 * @param {string | symbol} result
 * @returns {string}
 */
export function normalizeResult(result) {
	if (isCancel(result)) {
		showCancelMessage();
	}
	return typeof result === 'string' ? result?.trim() : '';
}

/**
 * * Mimic clack left vertical line before a message
 * @param {string} message message to print
 * @param {boolean} [suffix=false] If true, adds a pipe in new line
 */
export function mimicClack(message, suffix = false) {
	console.log(
		chalk.gray('│\n') +
			chalk.green('◇  ') +
			message +
			(suffix ? chalk.gray('\n│') : ''),
	);
}
