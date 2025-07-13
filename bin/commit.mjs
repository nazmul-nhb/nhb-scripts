#!/usr/bin/env node
// commit.mjs

// @ts-check

import chalk from 'chalk';
import { execa } from 'execa';
import fs from 'fs/promises';
import semver from 'semver';
import Enquirer from 'enquirer';
import { estimator } from '../lib/estimator.mjs';
import { loadCommitConfig } from '../lib/load-commit-config.mjs';
import { runFormatter } from '../lib/prettier-formatter.mjs';

/** @typedef {import('type-fest').PackageJson} PackageJson */

const enquirer = new Enquirer();

/**
 * * Updates the version field inside package.json
 * @param {string} newVersion
 */
async function updateVersion(newVersion) {
	const raw = await fs.readFile('./package.json', 'utf-8');
	/** @type {PackageJson} */
	const pkg = JSON.parse(raw);
	pkg.version = newVersion;
	await fs.writeFile('./package.json', JSON.stringify(pkg, null, 2) + '\n');
	console.info(chalk.green(`✅ Version updated to ${newVersion}`));
}

/**
 * * Git commit and push with provided message
 * @param {string} message
 * @param {string} version
 */
async function commitAndPush(message, version) {
	console.info(chalk.blue('📤 Committing and pushing changes...'));
	await estimator(
		execa('git', ['add', '.']).then(() =>
			execa('git', ['commit', '-m', message]).then(() =>
				execa('git', ['push'], { stdio: 'inherit' }),
			),
		),
		chalk.blue('Committing & pushing...'),
	);
	console.info(chalk.green(`✅ Version ${version} pushed with message: "${message}"`));
}

/**
 * @param {string} newVersion
 * @param {string} currentVersion
 */
function isValidVersion(newVersion, currentVersion) {
	if (newVersion === currentVersion) return true;
	return semver.valid(newVersion) && semver.gte(newVersion, currentVersion);
}

/** Prompt for version, type, scope, and commit message */
async function finalPush() {
	const raw = await fs.readFile('./package.json', 'utf-8');
	/** @type {PackageJson} */
	const pkg = JSON.parse(raw);
	const oldVersion = pkg.version || '0.0.0';

	const config = await loadCommitConfig();

	/** @type {string} */
	let version = '';

	while (true) {
		try {
			const result = /** @type {{ value: string }} */ (
				await enquirer.prompt({
					type: 'input',
					name: 'value',
					message: `Current version: ${chalk.yellow(oldVersion)}\n> Enter new version (press enter to skip):`,
				})
			);

			version = result.value?.trim();

			if (!version) {
				version = oldVersion;
				console.info(
					chalk.cyanBright(
						`${chalk.red('⨉')} Using previous version: ${chalk.yellow(version)}`,
					),
				);
				break;
			}

			if (!isValidVersion(version, oldVersion)) {
				console.log(
					chalk.red('⚠ Invalid or older version. Use valid semver like 1.2.3'),
				);
				continue;
			}

			console.log(`✔ Selected version: ${version}`);
			break;
		} catch {
			console.log(chalk.gray('⛔ Process cancelled by user!'));
			process.exit(0);
		}
	}

	const typeChoices = [
		{ title: '🌀 update (default)', value: 'update' },
		{ title: '✨ feat', value: 'feat' },
		{ title: '🐛 fix', value: 'fix' },
		{ title: '🛠️  chore', value: 'chore' },
		{ title: '🧼 refactor', value: 'refactor' },
		{ title: '🧪 test', value: 'test' },
		{ title: '📚 docs', value: 'docs' },
		{ title: '💅 style', value: 'style' },
		{ title: '⚡ perf', value: 'perf' },
		{ title: '🔁 revert', value: 'revert' },
		{ title: '🧱 build', value: 'build' },
		{ title: '🚀 ci', value: 'ci' },
		{ title: '✍  Custom...', value: '__custom__' },
	];

	/** @typedef {{
	 *   type: string,
	 *   customType: string,
	 *   scope?: string,
	 *   message: string
	 * }} CommitPromptResponse
	 */

	try {
		const promptResults = /** @type {CommitPromptResponse} */ (
			await enquirer.prompt([
				{
					type: 'select',
					name: 'type',
					message: chalk.cyan('Select commit type:'),
					choices: typeChoices.map((c) => ({
						name: String(c.value),
						message: c.title,
					})),
				},
				{
					// @ts-ignore – Enquirer accepts dynamic `type` functions
					type: (prev) => (prev === '__custom__' ? 'input' : undefined),
					name: 'customType',
					message: chalk.magenta('Enter custom commit type:'),
					validate: (val) => (val?.trim() ? true : 'Type is required!'),
				},
				{
					type: 'input',
					name: 'scope',
					message: chalk.gray('Enter scope (optional):'),
				},
				{
					type: 'input',
					name: 'message',
					message: chalk.cyan('Enter commit message (required):'),
					validate: (val) => (val.trim() ? true : '⚠ Message cannot be empty!'),
				},
			])
		);

		/** @type {string} */
		const finalType =
			promptResults.type === '__custom__' ?
				promptResults?.customType?.trim()
			:	promptResults.type;

		/** @type {string} */
		const formattedMessage =
			promptResults.scope?.trim() ?
				`${finalType}(${promptResults.scope.trim()}): ${promptResults.message.trim()}`
			:	`${finalType}: ${promptResults.message.trim()}`;

		if (version !== oldVersion) {
			await updateVersion(version);
		}

		if (config.runFormatter) {
			await runFormatter();
		}

		await commitAndPush(formattedMessage, version);
	} catch {
		console.log(chalk.gray('⛔ Process cancelled by user!'));
		process.exit(0);
	}
}

finalPush().catch((err) => {
	console.error(chalk.red('🛑 Unexpected Error:'), err);
	process.exit(1);
});
