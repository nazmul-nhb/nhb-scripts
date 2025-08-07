#!/usr/bin/env node
// bin/delete.mjs

// @ts-check

import {
	confirm,
	intro,
	isCancel,
	multiselect,
	outro,
	select,
	spinner,
	text,
} from '@clack/prompts';
import chalk from 'chalk';
import { isValidArray, pluralizer } from 'nhb-toolbox';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { rimraf } from 'rimraf';
import {
	mimicClack,
	normalizeBooleanResult,
	normalizeStringResult,
	showCancelMessage,
	validateStringInput,
} from '../lib/clack-utils.mjs';

/**
 * Always resolve a path from cwd
 * @param {string} p
 */
function resolveFromCwd(p) {
	return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
}

/**
 * Browse directories with explicit navigation and deletion.
 * @param {string} dir - current directory
 * @param {string} rootDir - initial root directory
 * @param {string | null} parentDir - parent directory
 * @returns {Promise<string[]>}
 */
async function browseDir(dir, rootDir = dir, parentDir = null) {
	while (true) {
		const entries = fs.readdirSync(dir, { withFileTypes: true });

		// Build folder list (non-empty only)
		const subFolders = entries.filter((e) => {
			if (!e.isDirectory()) return false;
			const abs = path.join(dir, e.name);
			return fs.readdirSync(abs).length > 0;
		});

		const hasSubFolders = subFolders.length > 0;
		const hasFilesOrFolders = entries.length > 0;

		// ✅ If there are NO subfolders at all (only files or empty),
		// go directly into selection mode
		if (!hasSubFolders && hasFilesOrFolders) {
			const choices = entries.map((entry) => ({
				value: path.join(dir, entry.name),
				label: entry.isDirectory() ? `📁 ${entry.name}` : `📄 ${entry.name}`,
			}));

			const locked = await multiselect({
				message: chalk.cyan(
					`✅ Select items to delete in ${path.relative(process.cwd(), dir) || dir}`
				),
				options: choices,
				required: false,
			});

			if (isCancel(locked)) {
				outro(chalk.redBright('🛑 Operation cancelled!'));
				process.exit(0);
			}
			if (isValidArray(locked)) return locked;

			// Nothing selected, loop back
			continue;
		}

		// ✅ Otherwise, show menu with "delete" and navigable subfolders
		const options = [
			{ value: 'delete', label: '✅ Select items to delete here' },
			...subFolders.map((sf) => ({
				value: path.join(dir, sf.name),
				label: `📁 Open: ${sf.name}`,
			})),
			...(parentDir && path.resolve(dir) !== path.resolve(rootDir) ?
				[{ value: '__back__', label: '🔙 Go Back' }]
			:	[]),
		];

		const action = normalizeStringResult(
			await select({
				message: chalk.cyan(`📂 ${path.relative(process.cwd(), dir) || dir}`),
				options,
			})
		);

		// Back navigation
		if (action === '__back__' && parentDir) {
			return await browseDir(parentDir, rootDir, path.dirname(parentDir));
		}

		// Selecting delete
		if (action === 'delete') {
			const choices = entries.map((entry) => ({
				value: path.join(dir, entry.name),
				label: entry.isDirectory() ? `📁 ${entry.name}` : `📄 ${entry.name}`,
			}));

			const locked = await multiselect({
				message: chalk.cyan(
					`✅ Select items to delete in ${path.relative(process.cwd(), dir) || dir}`
				),
				options: choices,
				required: false,
			});

			if (isCancel(locked)) {
				outro(chalk.redBright('🛑 Operation cancelled!'));
				process.exit(0);
			}
			if (isValidArray(locked)) return locked;

			continue; // nothing selected, loop again
		}

		// ✅ Manual selection of a subfolder: check emptiness first
		if (action && action !== '__back__') {
			const contents = fs.readdirSync(action);
			if (!isValidArray(contents)) {
				const confirmEmpty = normalizeBooleanResult(
					await confirm({
						message: chalk.red(
							`🗑 "${path.basename(action)}" is empty. Delete it?`
						),
						initialValue: true,
					})
				);
				if (confirmEmpty) return [action];
				continue; // skip deletion, loop again
			}
			// not empty → navigate deeper
			return await browseDir(action, rootDir, dir);
		}
	}
}

(async () => {
	intro(chalk.redBright.bold('🗑 Delete Directory/File(s)'));

	const inputPath = normalizeStringResult(
		await select({
			message: chalk.blue('Enter a base path or choose current directory'),
			options: [
				{ value: process.cwd(), label: '📂 Current Directory' },
				{ value: '__manual__', label: '✏️  Enter manually' },
			],
		})
	);

	let basePath = inputPath;
	if (inputPath === '__manual__') {
		const manual = normalizeStringResult(
			await text({
				message: chalk.blue('Type or paste full path'),
				placeholder: 'e.g. src',
				validate: validateStringInput,
			})
		);
		basePath = resolveFromCwd(manual);
	} else {
		basePath = resolveFromCwd(basePath);
	}

	if (!fs.existsSync(basePath)) {
		showCancelMessage('⛔ Path does not exist!');
	}

	/** @type {Array<string>} */
	let targets = [];

	if (fs.statSync(basePath).isDirectory()) {
		const contents = fs.readdirSync(basePath);
		if (contents.length === 0) {
			const confirmEmpty = normalizeBooleanResult(
				await confirm({
					message: chalk.red(
						`🗑 "${path.basename(basePath)}" is empty. Delete it?`
					),
					initialValue: true,
				})
			);
			if (confirmEmpty) {
				targets = [basePath];
			} else {
				showCancelMessage('🛑 Deletion Aborted!!');
			}
		} else {
			targets = await browseDir(basePath, basePath, null);
		}
	} else {
		targets = [basePath];
	}

	if (!isValidArray(targets)) {
		showCancelMessage('🛑 Nothing is selected!');
	}

	const totalItems = pluralizer.pluralize('item', {
		count: targets.length,
		inclusive: true,
	});

	const confirmed = normalizeBooleanResult(
		await confirm({
			message: chalk.red(`❓ Are you sure to delete ${totalItems}?`),
			initialValue: true,
		})
	);

	if (!confirmed) {
		showCancelMessage('🛑 Deletion aborted!');
	}

	const s = spinner();
	s.start('🔃 Deleting...');
	for (const target of targets) {
		try {
			const st = fs.statSync(target);
			if (st.isDirectory()) {
				await rimraf(target, { glob: false, preserveRoot: false });
			} else {
				await fs.promises.unlink(target);
			}
			mimicClack(
				`${chalk.green('✨ Deleted')} : ${chalk.yellowBright(path.relative(process.cwd(), target))}`
			);
		} catch (err) {
			console.error(
				chalk.red('🛑 Delete Failed: ') + path.relative(process.cwd(), target),
				err
			);
			process.exit(0);
		}
	}
	s.stop('✅ Operation Successful!');

	outro(chalk.green(`🎉 Deleted ${totalItems}!`));
})();
