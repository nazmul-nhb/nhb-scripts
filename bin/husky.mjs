#!/usr/bin/env node
// bin/husky.mjs

// @ts-check

import { intro, outro, spinner } from '@clack/prompts';
import chalk from 'chalk';
import { execa } from 'execa';

import { existsSync } from 'fs';
import { writeFile } from 'fs/promises';
import path from 'path';
import { mimicClack } from '../lib/clack-utils.mjs';
import { installDeps } from '../lib/install-deps.mjs';
import { parsePackageJson } from '../lib/package-json-utils.mjs';

async function initHusky() {
	intro(chalk.cyanBright('🐕 Setup Husky with Lint-Staged'));

	const devDeps = ['husky', 'lint-staged'];

	if (!isHuskyInstalled()) {
		const s = spinner();
		s.start(chalk.yellowBright("🔃 Installing 'husky' and 'lint-staged'"));

		await installDeps([], devDeps);

		s.stop(chalk.green("✅ Installed 'husky' and 'lint-staged'!"));
	}

	await execa('husky', ['init'], { cwd: process.cwd() });

	const cwd = process.cwd();

	const huskyPath = path.join(cwd, '.husky/pre-commit');
	const huskyContent = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

if [ -f "pnpm-lock.yaml" ]; then
  pnpm exec lint-staged
elif [ -f "yarn.lock" ]; then
  yarn lint-staged
elif [ -f "bun.lockb" ]; then
  bunx lint-staged
else
  npx lint-staged
fi
`;

	await writeFile(huskyPath, huskyContent, 'utf-8');
	mimicClack(chalk.gray('⚙️  Updated ".husky/pre-commit"'));

	const lsPath = path.join(cwd, '.lintstagedrc.json');
	const lsContent = JSON.stringify(
		{ '*.+((c|m)?js(x)?|(c|m)?ts(x)?)': ['prettier --write'] },
		null,
		2
	);

	if (!existsSync(lsPath)) {
		await writeFile(lsPath, lsContent, 'utf-8');
		mimicClack(chalk.gray('⚙️  Created default ".lintstagedrc.json"'));
	}

	outro(chalk.cyanBright(`🎉 Husky Setup Complete!`));
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
