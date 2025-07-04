#!/usr/bin/env node
// commit.mjs

// @ts-check

import chalk from 'chalk';
import { execa } from 'execa';
import fs from 'fs/promises';
import prompts from 'prompts';
import semver from 'semver';
import { estimator } from '../lib/estimator.mjs';

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
				execa('git', ['push'], { stdio: 'inherit' })
			)
		),
		chalk.blue('Committing & pushing...')
	);

	console.info(
		chalk.green(`✅ Version ${version} pushed with message: "${message}"`)
	);
}

/**
 * @param {string} newVersion
 * @param {string} currentVersion
 */
function isValidVersion(newVersion, currentVersion) {
	if (newVersion === currentVersion) return true;
	return semver.valid(newVersion) && semver.gte(newVersion, currentVersion);
}

/**
 * * Prompt for version, type, scope, and commit message
 */
async function main() {
	const packageJsonPath = './package.json';
	const raw = await fs.readFile(packageJsonPath, 'utf-8');
	/** @type {PackageJson} */
	const pkg = JSON.parse(raw);
	const oldVersion = pkg.version || '0.0.0';

	/** @type {string} */
	let version = '';

	while (true) {
		const input = await prompts({
			type: 'text',
			name: 'value',
			message: `Current version: ${chalk.yellow(oldVersion)}\nEnter new version (press enter to skip):`,
		});

		version = input.value?.trim();

		if (!version) {
			version = oldVersion;
			console.info(
				chalk.cyanBright(`❕ Using previous version: ${chalk.yellow(version)}`)
			);
			break;
		}

		if (!isValidVersion(version, oldVersion)) {
			console.log(
				chalk.red('⚠ Invalid or older version. Use valid semver like 1.2.3')
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
	];

	const { type = 'update' } = await prompts({
		type: 'select',
		name: 'type',
		message: chalk.cyan('Select commit type:'),
		choices: typeChoices,
		initial: 0
	});

	const { scope } = await prompts({
		type: 'text',
		name: 'scope',
		message: chalk.gray('Enter scope (optional):'),
	});

	let message = '';

	while (!message?.trim()) {
		const { value } = await prompts({
			type: 'text',
			name: 'value',
			message: chalk.cyan('Enter commit message (required):'),
		});
		message = value;
		if (!message?.trim()) {
			console.log(chalk.yellow('⚠ Message cannot be empty!'));
		}
	}

	const formattedMessage = scope
		? `${type}(${scope}): ${message}`
		: `${type}: ${message}`;

	if (version !== oldVersion) {
		await updateVersion(version);
	}

	await commitAndPush(formattedMessage, version);
}

main().catch((err) => {
	console.error(chalk.red('🛑 Unexpected Error:'), err);
	process.exit(1);
});
