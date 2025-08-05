#!/usr/bin/env node
// bin/husky.mjs

// @ts-check

import { installDeps } from '../lib/install-deps.mjs';
import { parsePackageJson } from '../lib/package-json-utils.mjs';

async function initHusky() {
	const devDeps = ['husky', 'lint-staged'];

	if (!isHuskyInstalled()) {
		await installDeps([], devDeps);
	}
}

/**
 * Check if husky and lint-staged is listed in deps/devDeps
 * @returns {boolean}
 */
function isHuskyInstalled() {
	try {
		const pkg = parsePackageJson();

		return Boolean(
			(pkg.dependencies &&
				pkg.dependencies.husky &&
				pkg.dependencies?.['lint-staged']) ||
				(pkg.devDependencies &&
					pkg.devDependencies.prettier &&
					pkg.devDependencies?.['lint-staged'])
		);
	} catch {
		return false;
	}
}
