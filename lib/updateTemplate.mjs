// @ts-check

import { readFileSync, writeFileSync } from 'fs';
import { capitalizeString, pluralizer } from 'nhb-toolbox';
import { resolve } from 'path';

/**
 * Add an item in `COLLECTIONS` array in `src/app/constants/index.ts`.
 * @param {string} moduleName Name of the module
 */
export function updateCollection(moduleName) {
	const filePath = resolve('src/app/constants/index.ts');
	const content = readFileSync(filePath, 'utf8');
	const capModule = capitalizeString(moduleName);

	const match = content.match(/export const COLLECTIONS = \[\n([\s\S]+?)\n\] as const;/);

	if (!match) {
		throw new Error('COLLECTIONS array not found!');
	}

	// Check if item already exists
	if (match[1].includes(`'${capModule}'`)) return;

	// Inject the new item before the closing bracket
	const updated = content.replace(
		match[0],
		`export const COLLECTIONS = [\n${match[1].trimEnd()}\n\t'${capModule}',\n] as const;`,
	);

	writeFileSync(filePath, updated);
}

/**
 * Add a route details in `src/app/routes/index.ts`.
 * @param {string} moduleName Name of the module
 */
export function updateRoutes(moduleName) {
	const filePath = resolve('src/app/routes/index.ts');
	let content = readFileSync(filePath, 'utf8');

	const path = pluralizer.toPlural(moduleName);
	const routeName = `${moduleName}Routes`;

	const routeLine = `{ path: '/${path}', route: ${routeName} }`;

	if (content.includes(routeLine)) return;

	// Add new import line
	if (!content.includes(`import { ${routeName} }`)) {
		content =
			`import { ${routeName} } from '../modules/${moduleName}/${moduleName}.routes';\n` +
			content;
	}

	// Inject into the routes array
	content = content.replace(
		/const routes: IRoute\[\] = \[(.*?)\];/s,
		(_, /** @type {string} */ inner) =>
			`const routes: IRoute[] = [${inner.trimEnd()}\n\t${routeLine},\n];`,
	);

	writeFileSync(filePath, content);
}
