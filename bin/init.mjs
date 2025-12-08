#!/usr/bin/env node
// bin/init.mjs

// @ts-check

import { initConfigFile } from '../lib/config-loader.mjs';

initConfigFile(true);
