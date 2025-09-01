#!/usr/bin/env node
// bin/format.mjs

// @ts-check

import { intro, outro } from '@clack/prompts';
import chalk from 'chalk';
import { runFormatter } from '../lib/prettier-formatter.mjs';

async function format() {
	intro(chalk.cyan.bold('🚀 Run Prettier Formatter'));

	await runFormatter();

	outro(chalk.green('🎉 Successfully Formatted!'));
}

format().catch((err) => {
	console.error('🛑 Formatter failed:', err);
	process.exit(0);
});
