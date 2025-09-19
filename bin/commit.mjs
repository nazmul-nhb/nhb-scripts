#!/usr/bin/env node
// bin/commit.mjs

// @ts-check

import { intro, note, outro, select, spinner, text } from '@clack/prompts';
import chalk from 'chalk';
import { execa } from 'execa';
import semver from 'semver';

import { confirm } from '@clack/prompts';
import {
	mimicClack,
	normalizeBooleanResult,
	normalizeStringResult,
	validateStringInput,
} from '../lib/clack-utils.mjs';
import { loadUserConfig } from '../lib/config-loader.mjs';
import { parsePackageJson, writeToPackageJson } from '../lib/package-json-utils.mjs';
import { runFormatter } from '../lib/prettier-formatter.mjs';

/**
 * * Updates version in package.json
 * @param {string} newVersion
 */
async function updateVersion(newVersion) {
	const pkg = parsePackageJson();

	pkg.version = newVersion;

	await writeToPackageJson(pkg);

	mimicClack(chalk.green(`✓ Version updated to ${chalk.yellowBright(newVersion)}`));
}

/**
 * * Git commit and push with message
 * @param {string} message Commit message
 * @param {string} version Version string
 */
export async function commitAndPush(message, version) {
	const s = spinner();

	s.start(chalk.blue('📤 Changes are committing'));

	try {
		await execa('git', ['add', '.']);

		const { stdout: commitOut } = await execa('git', ['commit', '-m', message]);

		if (commitOut.trim()) {
			const commitLines = commitOut
				.split('\n')
				.filter(Boolean)
				.map((line) => chalk.cyan('• ') + line?.trim())
				.join('\n');

			note(commitLines, chalk.magenta('📤 Commit Summary'));
		}

		s.stop(chalk.green('✅ Changes are committed successfully!'));

		const shouldPush = normalizeBooleanResult(
			await confirm({
				message: chalk.yellow(`❔ Push to remote repository?`),
				initialValue: true,
			})
		);

		if (shouldPush) {
			const s2 = spinner();

			s2.start(chalk.blue('📌 Pushing to remote repository'));

			const { stdout, stderr } = await execa('git', ['push', '--verbose']);

			const pushOut = (stdout + '\n' + stderr)?.trim();

			if (pushOut) {
				const lines = pushOut
					?.split('\n')
					.filter(Boolean)
					.map((line) => chalk.cyan('• ') + line?.trim())
					.join('\n');

				note(lines, chalk.magenta('📌 Push Summary'));
			}

			s2.stop(chalk.green('✅ Changes are pushed successfully!'));

			outro(chalk.green(`🚀 Version ${version} pushed with message: "${message}"`));
		} else {
			outro(chalk.green(`🚀 Version ${version} committed with message: "${message}"`));
		}
	} catch (err) {
		s.stop(chalk.red('🛑 Commit or push failed!'));
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

	const pkg = parsePackageJson();

	const oldVersion = pkg.version || '0.0.0';

	const config = (await loadUserConfig()).commit ?? {};

	mimicClack(`Current version: ${chalk.yellow(oldVersion)}`);

	let version = '';
	while (true) {
		const input = normalizeStringResult(
			await text({
				message: `${chalk.cyanBright.bold('Enter new version (press enter to skip):')}`,
				placeholder: oldVersion,
				defaultValue: oldVersion,
				initialValue: oldVersion,
			})
		);

		version = (input || '').trim();
		if (!version) {
			version = oldVersion;
			mimicClack(
				chalk.cyanBright(`🔄️ Using previous version: ${chalk.yellow(version)}`)
			);
			break;
		}

		if (!isValidVersion(version, oldVersion)) {
			mimicClack(chalk.red('🛑 Invalid or older version. Use valid semver like 1.2.3'));
			continue;
		}

		mimicClack(chalk.green(`✔ Selected version: ${chalk.yellowBright(version)}`));
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

	const typeResult = normalizeStringResult(
		await select({
			message: chalk.cyan('Select commit type:'),
			options: typeChoices,
		})
	);

	let finalType = typeResult;
	if (typeResult === '__custom__') {
		const customType = normalizeStringResult(
			await text({
				message: chalk.magenta('Enter custom commit type:'),
				validate: validateStringInput,
			})
		);

		finalType = customType;
	}

	const scopeResult = normalizeStringResult(
		await text({
			message: chalk.gray('Enter a scope (optional):'),
			placeholder: 'e.g. api, ui, auth',
		})
	);

	const messageResult = normalizeStringResult(
		await text({
			message: chalk.cyan('Enter commit message (required):'),
			placeholder: 'e.g. added new feature, fixed bug in auth module etc.',
			validate: validateStringInput,
		})
	);

	console.log(chalk.gray('│'));

	const formattedMessage =
		scopeResult ?
			`${finalType}(${scopeResult}): ${messageResult}`
		:	`${finalType}: ${messageResult}`;

	if (version !== oldVersion) {
		await updateVersion(version);
	}

	config?.runBefore?.();

	if (config.runFormatter) {
		await runFormatter();
	}

	await commitAndPush(formattedMessage, version);

	config?.runAfter?.();
}

finalPush().catch((err) => {
	console.error(chalk.red('🛑 Unexpected Error:'), err);
	process.exit(0);
});
