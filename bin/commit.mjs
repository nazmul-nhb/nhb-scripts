#!/usr/bin/env node
// bin/commit.mjs

// @ts-check

import { intro, isCancel, outro, select, spinner, text } from '@clack/prompts';
import chalk from 'chalk';
import { execa } from 'execa';
import fs from 'fs/promises';
import semver from 'semver';
import { loadUserConfig } from '../lib/config-loader.mjs';
import { runFormatter } from '../lib/prettier-formatter.mjs';
import { note } from '@clack/prompts';

/** @typedef {import('type-fest').PackageJson} PackageJson */

/**
 * * Updates version in package.json
 * @param {string} newVersion
 */
async function updateVersion(newVersion) {
	const raw = await fs.readFile('./package.json', 'utf-8');
	/** @type {PackageJson} */
	const pkg = JSON.parse(raw);
	pkg.version = newVersion;
	await fs.writeFile('./package.json', JSON.stringify(pkg, null, 2) + '\n');
	console.info(chalk.green(`✓  Version updated to ${newVersion}`));
}

/**
 * * Git commit and push with message
 * @param {string} message Commit message
 * @param {string} version Version string
 */
export async function commitAndPush(message, version) {
	const s = spinner();

	s.start(chalk.blue('📤 Committing & pushing changes'));

	try {
		await execa('git', ['add', '.']);
		await execa('git', ['commit', '-m', message]);
		const { stdout } = await execa('git', ['push']);

		s.stop(chalk.green('✓ Changes committed and pushed!'));

		if (stdout?.trim()) {
			const lines = stdout
				.split('\n')
				.filter(Boolean)
				.map((line) => chalk.cyan('• ') + line)
				.join('\n');

			note(lines, chalk.magenta('✓ Status after Remote Push'));
		}

		outro(chalk.green(`🚀 Version ${version} pushed with message: "${message}"`));
	} catch (err) {
		s.stop(chalk.red('❌ Commit or push failed!'));
		console.error(chalk.red(err));
		process.exit(0);
	}
}

/**
 * @param {string} newVersion
 * @param {string} currentVersion
 */
function isValidVersion(newVersion, currentVersion) {
	if (newVersion === currentVersion) return true;
	return semver.valid(newVersion) && semver.gte(newVersion, currentVersion);
}

/** Prompt flow */
async function finalPush() {
	intro(chalk.cyan('🚀 Commit & Push'));

	const raw = await fs.readFile('./package.json', 'utf-8');
	/** @type {PackageJson} */
	const pkg = JSON.parse(raw);
	const oldVersion = pkg.version || '0.0.0';

	const config = (await loadUserConfig()).commit ?? {};

	let version = '';
	while (true) {
		const input = await text({
			message: `Current version: ${chalk.yellow(oldVersion)}\n>  Enter new version (press enter to skip):`,
			placeholder: oldVersion,
			defaultValue: oldVersion,
		});

		if (isCancel(input)) {
			console.log(chalk.gray('⛔ Process cancelled by user!'));
			process.exit(0);
		}

		version = (input || '').trim();
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
				chalk.red('⚠  Invalid or older version. Use valid semver like 1.2.3'),
			);
			continue;
		}

		console.log(`✔  Selected version: ${version}`);
		break;
	}

	const typeChoices = [
		{ value: 'update', label: '🔧 update (default)' },
		{ value: 'feat', label: '✨ feat' },
		{ value: 'fix', label: '🐛 fix' },
		{ value: 'chore', label: '🛠️  chore' },
		{ value: 'refactor', label: '🧼 refactor' },
		{ value: 'test', label: '🧪 test' },
		{ value: 'docs', label: '📚 docs' },
		{ value: 'style', label: '💅 style' },
		{ value: 'perf', label: '⚡ perf' },
		{ value: 'revert', label: '🔁 revert' },
		{ value: 'build', label: '🧱 build' },
		{ value: 'ci', label: '🚀 ci' },
		{ value: 'release', label: '🔖 release' },
		{ value: 'deps', label: '📦 deps' },
		{ value: 'cleanup', label: '🧹 cleanup' },
		{ value: 'merge', label: '🧭 merge' },
		{ value: '__custom__', label: '✍  Custom...' },
	];

	const typeResult = await select({
		message: chalk.cyan('Select commit type:'),
		options: typeChoices,
	});

	if (isCancel(typeResult)) {
		console.log(chalk.gray('⛔ Process cancelled by user!'));
		process.exit(0);
	}

	let finalType = typeResult;
	if (typeResult === '__custom__') {
		const customType = await text({
			message: chalk.magenta('Enter custom commit type:'),
			validate: (val) => (val?.trim() ? '' : 'Commit type is required!'),
		});
		if (isCancel(customType)) {
			console.log(chalk.gray('⛔ Process cancelled by user!'));
			process.exit(0);
		}
		finalType = (customType || '')?.trim();
	}

	const scopeResult = await text({
		message: chalk.gray('Enter a scope (optional):'),
	});
	if (isCancel(scopeResult)) {
		console.log(chalk.gray('⛔ Process cancelled by user!'));
		process.exit(0);
	}

	const messageResult = await text({
		message: chalk.cyan('Enter commit message (required):'),
		validate: (val) => (val.trim() ? '' : '⚠ Message cannot be empty!'),
	});
	if (isCancel(messageResult)) {
		console.log(chalk.gray('⛔ Process cancelled by user!'));
		process.exit(0);
	}

	const formattedMessage =
		scopeResult?.trim() ?
			`${finalType}(${scopeResult?.trim()}): ${messageResult?.trim()}`
			: `${finalType}: ${messageResult?.trim()}`;

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
	process.exit(0);
});
