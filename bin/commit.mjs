#!/usr/bin/env node
// commit.mjs

// @ts-check

import chalk from 'chalk';
import { execa } from 'execa';
import fs from 'fs/promises';
import prompts from 'prompts';
import semver from 'semver';
import { estimator } from '../lib/estimator.mjs';
import { loadCommitConfig } from '../lib/load-commit-config.mjs';
import { runFormatter } from '../lib/prettier-formatter.mjs';

/** @typedef {import('type-fest').PackageJson} PackageJson */

/**
 * * Updates the version field inside package.json
 * @param {string} newVersion
 */
async function updateVersion(newVersion) {
	const packageJsonPath = './package.json';
	const raw = await fs.readFile(packageJsonPath, 'utf-8');
	/** @type {PackageJson} */
	const pkg = JSON.parse(raw);
	pkg.version = newVersion;
	await fs.writeFile(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
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

/** * * Prompt for version, type, scope, and commit message */
async function finalPush() {
	const packageJsonPath = './package.json';
	const raw = await fs.readFile(packageJsonPath, 'utf-8');
	/** @type {PackageJson} */
	const pkg = JSON.parse(raw);
	const oldVersion = pkg.version || '0.0.0';

	const config = await loadCommitConfig();

	/** @type {string} */
	let version = '';

	while (true) {
		const input = await prompts(
			[
				{
					type: 'text',
					name: 'value',
					message: `Current version: ${chalk.yellow(oldVersion)}\n> Enter new version (press enter to skip):`,
				},
			],
			{
				onSubmit: (_, answer, __) => {
					console.log(`✔ Selected version: ${answer}`);
				},
				onCancel: () => process.exit(0),
			},
		);

		version = input.value?.trim();

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

		break;
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

	const { type, customType, scope, message } = await prompts(
		[
			{
				type: 'select',
				name: 'type',
				message: chalk.cyan('Select commit type:'),
				choices: typeChoices,
				initial: 0,
			},
			{
				type: (prev) => (prev === '__custom__' ? 'text' : null),
				name: 'customType',
				message: chalk.magenta('Enter custom commit type:'),
				validate: (val) => (val?.trim() ? true : 'Type is required!'),
			},
			{
				type: 'text',
				name: 'scope',
				message: chalk.gray('Enter scope (optional):'),
			},
			{
				type: 'text',
				name: 'message',
				message: chalk.cyan('Enter commit message (required):'),
				validate: (val) => (val.trim() ? true : '⚠ Message cannot be empty!'),
			},
		],
		{
			onCancel: () => process.exit(0),
		},
	);

	const finalType = type === '__custom__' ? customType?.trim() : type;

	const formattedMessage =
		scope ? `${finalType}(${scope}): ${message}` : `${finalType}: ${message}`;

	if (version !== oldVersion) {
		await updateVersion(version);
	}

	if (config.runFormatter) {
		await runFormatter();
	}

	await commitAndPush(formattedMessage, version);
}

finalPush().catch((err) => {
	console.error(chalk.red('🛑 Unexpected Error:'), err);
	process.exit(1);
});
