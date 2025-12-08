#!/usr/bin/env node
// bin/commit.mjs

// @ts-check

import { intro, log, outro, select, spinner, text } from '@clack/prompts';
import chalk from 'chalk';
import { execa } from 'execa';
import semver from 'semver';

import { confirm } from '@clack/prompts';
import { isValidArray } from 'nhb-toolbox';
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

const bar = chalk.gray('│');

/**
 * * Format commit and push `stderr` and `stdout` from `execa`
 * @param {string} out Output to format.
 */
function formatStdOut(out) {
	const msgs = out
		.split('\n')
		.filter(Boolean)
		.map((msg) => chalk.gray(msg.trim()));

	const bullet = (needBar = true) => chalk.green(`${needBar ? `\n${bar}` : ''}  • `);

	console.log(bar + bullet(false) + msgs.join(bullet()) + '\n' + bar);
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

		if (commitOut?.trim()) {
			log.message('\n');
			console.log('📤 ' + chalk.bold.blue.underline('Commit Summary'));
			formatStdOut(commitOut);
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
				log.message('\n');
				console.log('📌 ' + chalk.bold.red.underline('Push Summary'));
				formatStdOut(pushOut);
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

/** Run the final prompt flow */
async function runCommitPushFlow() {
	intro(chalk.cyan('🚀 Commit & Push'));

	const pkg = parsePackageJson();

	const oldVersion = pkg.version || '0.0.0';

	const {
		runBefore,
		runAfter,
		emojiBeforePrefix = false,
		runFormatter: shouldFormat = false,
		wrapPrefixWith: wrapPrefixWith = '',
		commitTypes,
	} = (await loadUserConfig()).commit ?? {};

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
			mimicClack(chalk.cyanBright(`🔄️ Using previous version: ${chalk.yellow(version)}`));
			break;
		}

		if (!isValidVersion(version, oldVersion)) {
			mimicClack(chalk.red('🛑 Invalid or older version. Use valid semver like 1.2.3'));
			continue;
		}

		mimicClack(chalk.green(`✔ Selected version: ${chalk.yellowBright(version)}`));
		break;
	}

	/** @type {Readonly<import('../types/index.d.ts').CommitType[]>} */
	const DEFAULT_CHOICES = Object.freeze([
		{ emoji: '🔧', type: 'update' },
		{ emoji: '✨', type: 'feat' },
		{ emoji: '🐛', type: 'fix' },
		{ emoji: '🛠️ ', type: 'chore' },
		{ emoji: '🧼', type: 'refactor' },
		{ emoji: '🧪', type: 'test' },
		{ emoji: '📚', type: 'docs' },
		{ emoji: '💅', type: 'style' },
		{ emoji: '⚡', type: 'perf' },
		{ emoji: '🔁', type: 'revert' },
		{ emoji: '🧱', type: 'build' },
		{ emoji: '🚀', type: 'ci' },
		{ emoji: '🔖', type: 'release' },
		{ emoji: '📦', type: 'deps' },
		{ emoji: '🧹', type: 'cleanup' },
		{ emoji: '🧭', type: 'merge' },
	]);

	/** @type {import('@clack/prompts').Option<string>} */
	const CUSTOM_CHOICE = { value: '__custom__', label: '✍  Custom...' };

	const { custom = [], overrideDefaults = false } = commitTypes || {};

	/** @type {Readonly<import('../types/index.d.ts').CommitType[]>} */
	const COMBINED =
		overrideDefaults && isValidArray(custom) ? custom : [...DEFAULT_CHOICES, ...custom];

	/** @type {import('@clack/prompts').Option<string>[]} */
	const typeChoices = COMBINED.map(({ emoji, type }, idx) => {
		return {
			value: emojiBeforePrefix ? `${emoji.trim()} ${type}` : type,
			label: `${emoji} ${type}`,
			hint: idx === 0 ? 'default' : undefined,
		};
	});

	const typeResult = normalizeStringResult(
		await select({
			message: chalk.cyan('Select commit type:'),
			options: [...typeChoices, CUSTOM_CHOICE],
		})
	);

	let finalType = typeChoices.find((type) => type.value === typeResult)?.value;

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
			`${wrapPrefixWith}${finalType}(${scopeResult}):${wrapPrefixWith} ${messageResult}`
		:	`${wrapPrefixWith}${finalType}:${wrapPrefixWith} ${messageResult}`;

	if (version !== oldVersion) {
		await updateVersion(version);
	}

	runBefore?.();

	if (shouldFormat) {
		await runFormatter();
	}

	await commitAndPush(formattedMessage, version);

	runAfter?.();
}

runCommitPushFlow().catch((err) => {
	console.error(chalk.red('🛑 Unexpected Error:'), err);
	process.exit(0);
});
