// @ts-check

import { existsSync } from 'node:fs';
import path from 'node:path';

/** Detect current package manager */
export function detectPackageManager() {
	const cwd = process.cwd();

	if (existsSync(path.join(cwd, 'pnpm-lock.yaml'))) return 'pnpm';
	if (existsSync(path.join(cwd, 'yarn.lock'))) return 'yarn';
	if (existsSync(path.join(cwd, 'bun.lockb'))) return 'bun';
	if (existsSync(path.join(cwd, 'package-lock.json'))) return 'npm';

	// fallback: try environment variable
	const ua = process.env.npm_config_user_agent || '';

	if (ua.includes('pnpm')) return 'pnpm';
	if (ua.includes('yarn')) return 'yarn';
	if (ua.includes('bun')) return 'bun';
	if (ua.includes('npm')) return 'npm';

	return 'npm';
}
