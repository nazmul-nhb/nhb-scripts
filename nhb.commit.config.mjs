// @ts-check

import { defineCommitConfig } from './index.mjs';

export default defineCommitConfig({
	runFormatter: true, // do not run formatter,  use `true` to format before committing 
});
