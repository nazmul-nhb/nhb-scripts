// @ts-check

import { readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

/** @import { PackageJson } from 'type-fest'; */

/** * Parse `package.json` and read its contents */
export function parsePackageJson() {
	return /** @type {PackageJson} */ (
		JSON.parse(readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8'))
	);
}

/**
 * * Rewrite the `package.json`
 * @param {PackageJson} pkg Content for `package.json`
 */
export async function writeToPackageJson(pkg) {
	const pkgPath = path.join(process.cwd(), 'package.json');

	try {
		await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
	} catch (error) {
		console.error(error);
		process.exit(0);
	}
}
