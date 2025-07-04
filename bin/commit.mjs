#!/usr/bin/env node
// commit.mjs

// @ts-check

import chalk from 'chalk';
import { execa } from 'execa';
import fs from 'fs/promises';
import path from 'path';
import readline from 'readline/promises';
import semver from 'semver';
import { estimator } from '../lib/estimator.mjs';

/** @typedef {import('type-fest').PackageJson} PackageJson */

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

/**
 * * Reads `package.json`, updates the version, and writes the changes.
 * @param {string} newVersion - The new version to set in package.json
 */
async function updateVersion(newVersion) {
	try {
		const packageJsonPath = './package.json';
		const packageData = await fs.readFile(packageJsonPath, 'utf-8');

		/** @type {PackageJson} */
		const packageJson = JSON.parse(packageData);

		packageJson.version = newVersion;
		await fs.writeFile(
			packageJsonPath,
			JSON.stringify(packageJson, null, 2) + '\n',
		);

		console.info(chalk.green(`✅ Version updated to ${newVersion}`));
	} catch (error) {
		console.error(chalk.red('🛑 Error updating package.json:', error));
		throw error;
	}
}

/**
 * * Runs Git commands to commit and push version changes.
 * @param {string} commitMessage - The commit message for version update.
 * @param {string} version - The updated version number.
 */
export async function commitAndPush(commitMessage, version) {
	try {
		console.info(chalk.blue('📤 Committing and pushing changes...'));

		await estimator(
			execa('git', ['add', '.']).then(() =>
				execa('git', ['commit', '-m', commitMessage]).then(() =>
					execa('git', ['push'], { stdio: 'inherit' }),
				),
			),
			chalk.blue('Committing & pushing...'),
		);

		console.info(
			chalk.green(
				`✅ Version ${version} pushed with message: "${commitMessage}"`,
			),
		);
	} catch (error) {
		console.error(chalk.red('🛑 Git error:', error));
		throw error;
	}
}

export async function getChangedFiles() {
	const { stdout } = await execa('git', [
		'status',
		'--porcelain',
		'--untracked-files=normal',
	]);

	return stdout
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean)
		.filter((line) => {
			const status = line.slice(0, 2);
			return ['M ', 'A ', '??'].some((prefix) =>
				status.startsWith(prefix),
			);
		})
		.map((line) => line.slice(2).trim()) // get file path
		.map((filePath) => path.resolve(process.cwd(), filePath));
}

/** * Runs Prettier only on untracked files. */
export async function formatUntrackedFiles() {
	try {
		console.info(chalk.magenta('🔍 Checking untracked files...'));

		const files = await getChangedFiles();

		if (!files.length) {
			console.info(chalk.greenBright('✅ No untracked files to format.'));
			return;
		}

		console.info(
			chalk.cyan(`📝 Formatting ${files.length} untracked files...`),
		);
		await estimator(
			execa('prettier', ['--write', ...files], { stdio: 'inherit' }),
			chalk.magenta('Formatting untracked files...'),
		);

		console.info(chalk.green('✅ Untracked files formatted!'));
	} catch (error) {
		console.error(chalk.red('🛑 Failed to format untracked files:'), error);
		throw error;
	}
}

/** * Runs prettier to format the codebase. */
export async function runFormatter() {
	try {
		console.info(chalk.magenta('🎨 Running Prettier to format code...'));

		await estimator(
			execa('prettier', ['--write', '.'], { stdio: 'inherit' }),
			chalk.magenta('Formatting in progress...'),
		);

		console.info(chalk.green('✅ Formatting complete!'));
	} catch (error) {
		console.error(chalk.red('🛑 Error running prettier:', error));
		throw error;
	}
}

/**
 * * Checks if the new version is equal or greater than the current version.
 * @param {string} newVersion - The new version entered.
 * @param {string} oldVersion - The current version.
 * @returns {boolean} True if newVersion is equal or greater, otherwise false.
 */
export function isValidVersion(newVersion, oldVersion) {
	if (newVersion === oldVersion) return true;

	const [major1, minor1, patch1] = newVersion.split('.').map(Number);
	const [major2, minor2, patch2] = oldVersion.split('.').map(Number);

	return (
		major1 > major2 ||
		(major1 === major2 && minor1 > minor2) ||
		(major1 === major2 && minor1 === minor2 && patch1 > patch2)
	);
}

/** * Main function to handle version bump, commit, and formatting. */
(async () => {
	try {
		const packageJsonPath = './package.json';
		const packageData = await fs.readFile(packageJsonPath, 'utf-8');

		/** @type {PackageJson} */
		const packageJson = JSON.parse(packageData);
		const oldVersion = packageJson.version;

		/** @type {string | undefined} - New Version */
		let newVersion;

		while (true) {
			newVersion = await rl.question(
				chalk.cyan(
					`Current version: ${chalk.yellow(oldVersion)}\nEnter new version: `,
				),
			);

			if (!newVersion?.trim()) {
				newVersion = oldVersion;
				console.info(
					chalk.cyanBright(
						`❕Continuing with the previous version ${chalk.yellow(newVersion)}`,
					),
				);
				break;
			}

			if (!semver.valid(newVersion)) {
				console.info(
					chalk.yellow(
						'⚠ Invalid semver format! Use formats like 1.2.3, 1.2.3-beta.1, etc.',
					),
				);
				continue;
			}

			// if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
			// 	console.info(
			// 		chalk.yellow(
			// 			'⚠ Invalid version format! Use semver (e.g., 1.2.3).',
			// 		),
			// 	);
			// 	continue;
			// }

			if (!semver.gte(newVersion, String(oldVersion))) {
				console.info(
					chalk.yellow(
						'⚠ New version must be equal or greater than the current version!',
					),
				);
				continue;
			}

			break;
		}

		let commitMessage = '';

		while (!commitMessage?.trim()) {
			commitMessage = await rl.question(
				chalk.cyan('Enter commit message (required): '),
			);

			if (!commitMessage?.trim()) {
				console.info(
					chalk.yellow('💀 Commit message cannot be empty!'),
				);
			}
		}

		rl.close();

		if (newVersion === oldVersion) {
			console.info(
				chalk.yellowBright(
					`✅ No version change detected. Current version: ${newVersion}`,
				),
			);
		} else {
			await updateVersion(String(newVersion));
		}

		// await runFormatter();
		// await formatUntrackedFiles();
		await commitAndPush(commitMessage, String(newVersion));
	} catch (error) {
		console.error(chalk.red('🛑 Unexpected Error:', error));
		process.exit(1);
	}
})();
