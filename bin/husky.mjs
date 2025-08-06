#!/usr/bin/env node
// bin/husky.mjs

// @ts-check

import { intro, outro, spinner } from '@clack/prompts';
import chalk from 'chalk';
import { execa } from 'execa';

import { installDeps } from '../lib/install-deps.mjs';
import { parsePackageJson } from '../lib/package-json-utils.mjs';
import path from 'path';
import { existsSync } from 'fs';
import { writeFile } from 'fs/promises';
import { mimicClack } from '../lib/clack-utils.mjs';

async function initHusky() {
	intro(chalk.cyanBright('🐕 Setup Husky with Lint-Staged'));

	const devDeps = ['husky', 'lint-staged'];

	const s = spinner();

	s.start(chalk.yellowBright("🔃 Installing 'husky' and 'lint-staged'"));

	if (!isHuskyInstalled()) {
		await installDeps([], devDeps);
	}

	s.stop(chalk.green("✅ Installed 'husky' and 'lint-staged'!"));

	await execa('husky', ['init'], { cwd: process.cwd() });

	const cwd = process.cwd();
	const lsPath = path.join(cwd, '.lintstagedrc.json');
	const huskyPath = path.join(cwd, '.husky/pre-commit');

	await writeFile(huskyPath, `lint-staged`, 'utf-8');

	const lsContent = JSON.stringify({ '*.+(js|ts)': ['prettier --write'] }, null, 2);

	if (!existsSync(lsPath)) {
		await writeFile(lsPath, lsContent, 'utf-8');
		mimicClack(chalk.gray('⚙️  Created default ".lintstagedrc.json"'));
	}

	outro(chalk.cyanBright(`⚙️  Husky Setup Complete!`));
}

/**
 * Check if husky and lint-staged is listed in deps/devDeps
 * @returns {boolean}
 */
function isHuskyInstalled() {
	try {
		const pkg = parsePackageJson();

		return Boolean(
			(pkg.dependencies &&
				pkg.dependencies.husky &&
				pkg.dependencies?.['lint-staged']) ||
				(pkg.devDependencies &&
					pkg.devDependencies.husky &&
					pkg.devDependencies?.['lint-staged'])
		);
	} catch {
		return false;
	}
}

initHusky().catch(console.dir);
