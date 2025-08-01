#!/usr/bin/env node
// bin/format.mjs

// @ts-check

import { runFormatter } from '../lib/prettier-formatter.mjs';

runFormatter().catch((err) => {
	console.error('🛑 Formatter failed:', err);
	process.exit(0);
});
