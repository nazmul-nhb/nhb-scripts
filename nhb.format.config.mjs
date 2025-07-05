// @ts-check

import { defineFormatConfig } from './lib/define-format-config.mjs';

export default defineFormatConfig({
    args: ['--write'],
    files: ['lib', 'bin', 'templates'],
    ignorePath: '.prettierignore',
});
