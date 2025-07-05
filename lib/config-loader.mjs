// @ts-check

import path from 'path';
import { pathToFileURL } from 'url';
import { existsSync } from 'fs';
import { cwd } from 'process';

/**
 * Load user-defined config file if present
 * @template T
 * @param {readonly string[]} candidates Array of config file names
 * @returns {Promise<T>}
 */
export async function loadUserConfig(candidates) {
    const root = cwd();
    const file = candidates.map(name => path.join(root, name)).find(existsSync);

    if (!file) {
        return /** @type {T} */({});
    }

    const configModule = await import(pathToFileURL(file).href);
    return /** @type {T} */ (configModule.default ?? configModule);
}
