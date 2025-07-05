// @ts-check

import path from 'path';
import { existsSync } from 'fs';
import { pathToFileURL } from 'url';
import { runFormatter } from '../lib/prettier-formatter.mjs';
import prompts from 'prompts';
import chalk from 'chalk';
import { writeFile } from 'fs/promises';

const commitConfigCandidates = [
	'nhb.commit.config.mjs',
	'nhb.commit.config.js',
];

/**
 * @typedef {import('../types/define-configs.d.ts').CommitConfig} CommitConfig
 */

/**
 * Load commit config or scaffold if not exists
 * @returns {Promise<CommitConfig>}
 */
export async function loadCommitConfig() {
	const cwd = process.cwd();
	const file = commitConfigCandidates.find((name) =>
		existsSync(path.join(cwd, name)),
	);

	if (file) {
		const mod = await import(pathToFileURL(path.join(cwd, file)).href);
		return mod.default ?? {};
	}

	const { value: shouldCreate } = await prompts({
		type: 'confirm',
		name: 'value',
		message: chalk.yellow(
			'⚙️  No nhb.commit.config.mjs found. Create one?',
		),
		initial: true,
	});

	if (!shouldCreate) {
		console.log(chalk.gray('  ⛔ Proceeding without commit config...'));
		return {};
	}

	const content = `// @ts-check

import { defineCommitConfig } from 'nhb-scripts';

export default defineCommitConfig({
	runFormatter: true,
});
`;

	const filePath = path.join(cwd, 'nhb.commit.config.mjs');
	await writeFile(filePath, content, 'utf-8');
	console.log(chalk.green(`✅ Created ${filePath}`));

	return { runFormatter: true };
}
