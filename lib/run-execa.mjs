// @ts-check

import { execa } from 'execa';

/**
 * @import { Options as ExecaOptions, ResultPromise } from 'execa';
 */

/**
 * * Runs a shell command safely using {@link execa} with options.
 *
 * @param {string} cmd The command to execute (e.g. `'pnpm'` or `'git'`).
 * @param {string[]} args The command arguments (e.g. `['run', 'build']`).
 * @param {ExecaOptions} options Optional settings for cwd, env, silent mode, etc.
 * @returns {Promise<ResultPromise>} Result of a subprocess successful execution..
 *
 * @example
 * await runExeca('pnpm', ['run', 'build'], { cwd: './packages/core' });
 *
 * @example
 * const { stdout } = await runExeca('git', ['status', '--short']);
 */
export async function runExeca(cmd, args = [], options = {}) {
	try {
		return await execa(cmd, args, { cwd: process.cwd(), ...options });
	} catch (error) {
		console.error('Error Running execa: ', error);
		process.exit(0);
	}
}
