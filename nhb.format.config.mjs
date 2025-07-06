// @ts-check

import { defineFormatConfig } from './index.mjs';

export default defineFormatConfig({
    args: ['--write'],
    files: ['lib', 'bin', 'templates'],
    ignorePath: '.prettierignore',
});
