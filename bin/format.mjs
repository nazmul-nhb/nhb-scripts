#!/usr/bin/env node
// format.mjs

// @ts-check

import { runFormatter } from '../lib/prettier-formatter.mjs';

runFormatter().catch((err) => {
	console.error('🛑 Formatter failed:', err.message);
	process.exit(0);
});
