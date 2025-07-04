// @ts-check

import path from 'path';
import { pathToFileURL } from 'url';
import { existsSync } from 'fs';
import { cwd } from 'process';

/**
 * @typedef {import('../types/define-module-config.d.ts').ModuleConfig} ModuleConfig
 */

/**
 * Load user-defined config file if present
 * @returns {Promise<ModuleConfig>}
 */
export async function loadUserConfig() {
    const root = cwd();
    const candidates = ['nhb.module.config.mjs', 'nhb.module.config.js'];
    const file = candidates.map(name => path.join(root, name)).find(existsSync);

    if (!file) {
        return {};
    }

    const configModule = await import(pathToFileURL(file).href);
    return configModule.default ?? configModule;
}
