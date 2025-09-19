#!/usr/bin/env node
// bin/count.mjs

// @ts-check

import { intro, outro, text } from '@clack/prompts';
import chalk from 'chalk';
import fs from 'fs/promises';
import { extname, join, resolve } from 'path';
import tsModule from 'typescript';
import { addPipeOnLeft, normalizeStringResult } from '../lib/clack-utils.mjs';
import { loadUserConfig } from '../lib/config-loader.mjs';

/**
 * @typedef {Object} Exports
 * @property {number} default Default export count.
 * @property {number} namedExportsTotal Total named export count.
 * @property {number} namedExportsDirect Original named export count.
 * @property {number} namedExportsAliased Aliased named export count.
 * @property {number} namedTypeExports Total named type export count.
 */

/**
 * Prompt the user to enter a JS/TS/MJS path (file or folder)
 * @returns {Promise<string>} The resolved path
 */
async function getFilePath() {
	intro(chalk.cyan.bold('📂 Export Counter'));

	const defaultPath = (await loadUserConfig()).count?.defaultPath ?? '.';

	const inputPath = normalizeStringResult(
		await text({
			message: chalk.gray(
				chalk.cyanBright.bold(
					`🎯 Please specify the path to a ${chalk.yellowBright('"js/ts/mjs"')} file or a folder containing ${chalk.yellowBright('"js/ts/mjs"')} files.\n`
				) +
					addPipeOnLeft(
						' - Enter the full file path (with extension) to process a specific file.\n'
					) +
					addPipeOnLeft(
						` - Enter a folder path to scan all ${chalk.bold.yellowBright('*.js')}, ${chalk.bold.yellowBright('*.ts')}, or ${chalk.bold.yellowBright('*.mjs')} files within.\n`
					) +
					addPipeOnLeft(
						` - Leave it empty to scan the default folder/file: ${chalk.bgYellowBright.bold.whiteBright(defaultPath)}\n`
					) +
					addPipeOnLeft()
			),
			placeholder: `e.g. ${chalk.yellowBright('src/app')} or ${chalk.yellowBright('src/index.ts')}`,
		})
	);

	const filePath = inputPath || defaultPath;
	return resolve(filePath);
}

/**
 * Count types of exports in a JS/TS file
 * @param {string} filePath
 * @returns {Promise<Exports>}
 */
async function countExports(filePath) {
	try {
		const content = await fs.readFile(filePath, 'utf-8');
		const sourceFile = tsModule.createSourceFile(
			filePath,
			content,
			tsModule.ScriptTarget.Latest,
			true
		);

		let namedExportsTotal = 0;
		let defaultExports = 0;
		let aliasedExports = 0;
		let namedTypeExports = 0;

		/** @param {import('typescript').Node} node */
		const checkNode = (node) => {
			if (tsModule.isExportAssignment(node)) {
				if (!node.isExportEquals) defaultExports += 1;
			} else if (
				tsModule.isFunctionDeclaration(node) ||
				tsModule.isClassDeclaration(node) ||
				tsModule.isInterfaceDeclaration(node) ||
				tsModule.isEnumDeclaration(node) ||
				tsModule.isTypeAliasDeclaration(node) ||
				tsModule.isVariableStatement(node)
			) {
				if (node.modifiers?.some((m) => m.kind === tsModule.SyntaxKind.ExportKeyword)) {
					if (
						node.modifiers.some(
							(m) => m.kind === tsModule.SyntaxKind.DefaultKeyword
						)
					) {
						defaultExports += 1;
					} else {
						namedExportsTotal += 1;
					}
				}
			} else if (
				tsModule.isExportDeclaration(node) &&
				node.exportClause &&
				tsModule.isNamedExports(node.exportClause)
			) {
				if (node.isTypeOnly) {
					namedTypeExports += node.exportClause.elements.length;
				} else {
					namedExportsTotal += node.exportClause.elements.length;
					for (const el of node.exportClause.elements) {
						if (el.propertyName && el.propertyName.text !== el.name.text) {
							aliasedExports += 1;
						}
					}
				}
			}

			tsModule.forEachChild(node, checkNode);
		};

		tsModule.forEachChild(sourceFile, checkNode);

		return {
			default: defaultExports,
			namedExportsTotal,
			namedExportsDirect: namedExportsTotal - aliasedExports,
			namedExportsAliased: aliasedExports,
			namedTypeExports,
		};
	} catch (err) {
		console.error(chalk.red('🛑 Failed to parse or read file:\n'), err);
		process.exit(0);
	}
}

/**
 * Recursively scan a folder for .js/.ts/.mjs
 * @param {string} folderPath
 * @returns {Promise<string[]>}
 */
async function getFilesFromFolder(folderPath) {
	const files = await fs.readdir(folderPath, { withFileTypes: true });
	/** @type {string[]} */
	let filePaths = [];

	for (const file of files) {
		const fullPath = join(folderPath, file.name);

		// Skip node_modules and dist directories
		if (file.isDirectory()) {
			const excludePaths = (await loadUserConfig()).count?.excludePaths ?? [
				'node_modules',
				'dist',
				'build',
			];

			if (excludePaths.includes(file.name)) {
				continue;
			}
			filePaths = filePaths.concat(await getFilesFromFolder(fullPath));
		} else if (['.js', '.ts', '.mjs'].includes(extname(file.name))) {
			filePaths.push(fullPath);
		}
	}

	return filePaths;
}

// Main Execution
(async () => {
	try {
		const filePath = await getFilePath();
		const stats = await fs.stat(filePath);

		let filesToProcess = [];

		if (stats.isDirectory()) {
			filesToProcess = await getFilesFromFolder(filePath);
			if (filesToProcess.length === 0) {
				throw new Error('No `.js`, `.mjs` or `.ts` files found in the folder.');
			}
		} else {
			filesToProcess = [filePath];
		}

		for (const file of filesToProcess) {
			const result = await countExports(file);

			console.info(chalk.green(`\n📦 Export Summary for "${file}":`));
			console.info(chalk.yellow(`🔸 Default Exports        : ${result.default}`));
			console.info(
				chalk.yellow(`🔹 Named Exports (Total)  : ${result.namedExportsTotal}`)
			);
			console.info(
				chalk.yellow(`   ┣ Direct               : ${result.namedExportsDirect}`)
			);
			console.info(
				chalk.yellow(`   ┗ Aliased              : ${result.namedExportsAliased}`)
			);
			console.info(
				chalk.yellow(`🔺 Total Type Exports     : ${result.namedTypeExports}`)
			);
		}

		outro(chalk.green('🎉 Scan completed!'));
	} catch (error) {
		console.error(chalk.red('🛑 Unexpected Error:\n'), error);
		process.exit(0);
	}
})();
