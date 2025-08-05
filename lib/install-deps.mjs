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
export async function installDeps(deps, devDeps) {
	const pkgMgr = detectPackageManager();

	/** @type {import('execa').Options} */
	const options = { cwd: process.cwd(), stdout: 'inherit', stderr: 'inherit' };

	switch (pkgMgr) {
		case 'pnpm':
			isValidArray(deps) && (await execa('pnpm', ['add', ...deps], options));
			isValidArray(devDeps) &&
				(await execa('pnpm', ['add', '-D', ...devDeps], options));
			break;
		case 'npm':
			isValidArray(deps) &&
				(await execa('npm', ['install', '--progress', ...deps], options));
			isValidArray(devDeps) &&
				(await execa('npm', ['install', '--progress', '-D', ...devDeps], options));
			break;
		case 'yarn':
			isValidArray(deps) && (await execa('yarn', ['add', ...deps], options));
			isValidArray(devDeps) &&
				(await execa('yarn', ['add', '--dev', ...devDeps], options));
			break;
		case 'bun':
			isValidArray(deps) && (await execa('bun', ['add', ...deps], options));
			isValidArray(devDeps) &&
				(await execa('bun', ['add', '-d', ...devDeps], options));
			break;
	}
}
