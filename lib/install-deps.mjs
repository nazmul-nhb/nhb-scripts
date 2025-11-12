// @ts-check

import { execa } from 'execa';
import path from 'path';
import { detectPackageManager } from './detect-package-manager.mjs';
import { isValidArray } from 'nhb-toolbox';

/**
 * * Install dependencies with the chosen package manager
 * @param {string[]} deps
 * @param {string[]} devDeps
 */
export async function installDeps(deps = [], devDeps = []) {
	const pkgMgr = detectPackageManager();

	/** @type {import('execa').Options} */
	const options = { cwd: process.cwd(), stdout: 'inherit', stderr: 'inherit' };

	const isValidDeps = isValidArray(deps);
	const isValidDevDeps = isValidArray(devDeps);

	switch (pkgMgr) {
		case 'pnpm':
			isValidDeps && (await execa('pnpm', ['add', ...deps], options));
			isValidDevDeps && (await execa('pnpm', ['add', '-D', ...devDeps], options));
			break;
		case 'npm':
			isValidDeps && (await execa('npm', ['install', '--progress', ...deps], options));
			isValidDevDeps &&
				(await execa('npm', ['install', '--progress', '-D', ...devDeps], options));
			break;
		case 'yarn':
			isValidDeps && (await execa('yarn', ['add', ...deps], options));
			isValidDevDeps && (await execa('yarn', ['add', '--dev', ...devDeps], options));
			break;
		case 'bun':
			isValidDeps && (await execa('bun', ['add', ...deps], options));
			isValidDevDeps && (await execa('bun', ['add', '-d', ...devDeps], options));
			break;
	}
}
