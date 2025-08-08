// @ts-check

import { readFileSync, writeFileSync } from 'fs';
import { capitalizeString, pluralizer } from 'nhb-toolbox';
import { resolve } from 'path';
import { showCancelMessage } from './clack-utils.mjs';

/**
 * Use comma for stringified array contents if it does not end with a comma.
 * @param {string} content Contents to apply comma on.
 * @returns Proper content with/without comma.
 */
export function useComma(content) {
	const updated = content?.trimEnd();

	return updated?.endsWith(',') ? updated : `${updated},`;
}

/**
 * Add an item in `COLLECTIONS` array in `src/app/constants/index.ts`.
 * @param {string} moduleName Name of the module
 */
export function updateCollection(moduleName) {
	const filePath = resolve('src/app/constants/index.ts');
	const content = readFileSync(filePath, 'utf8');
	const capModule = capitalizeString(moduleName);

	const match = content.match(/export const COLLECTIONS = \[(.*?)\] as const;/s);

	if (!match) {
		return showCancelMessage('🛑 "COLLECTIONS" array not found!');
	}

	// Check if item already exists
	if (match[1].includes(`'${capModule}'`)) return;

	// Inject the new item before the closing bracket
	const updated = content.replace(
		match[0],
		`export const COLLECTIONS = [${useComma(match[1])} '${capModule}'] as const;`
	);

	writeFileSync(filePath, updated);
}

/**
 * Add a route details in `src/app/routes/index.ts`.
 * @param {string} moduleName Name of the module
 * @param {boolean} [useAlias=false] - Whether to use import alias `@/` instead of `src/app/*`, must configure `tsconfig` and `package.json`.
 */
export function updateRoutes(moduleName, useAlias = false) {
	const filePath = resolve('src/app/routes/index.ts');
	let content = readFileSync(filePath, 'utf8');

	const path = pluralizer.toPlural(moduleName);
	const routeName = `${moduleName}Routes`;

	const routeLine = `{ path: '/${path}', route: ${routeName} }`;

	if (content.includes(routeLine)) return;

	// Add new import line
	if (!content.includes(`import { ${routeName} }`)) {
		content =
			`import { ${routeName} } from '${useAlias ? '@' : '..'}/modules/${moduleName}/${moduleName}.routes';\n` +
			content;
	}

	// Inject into the routes array
	content = content.replace(
		/const routes: IRoute\[\] = \[(.*?)\];/s,
		(_, /** @type {string} */ inner) =>
			`const routes: IRoute[] = [${useComma(inner)} ${routeLine}];`
	);

	writeFileSync(filePath, content);
}
