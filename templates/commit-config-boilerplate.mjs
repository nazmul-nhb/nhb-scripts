// @ts-check

export const commitConfigBoilerplate = `// @ts-check

import { defineCommitConfig } from 'nhb-scripts';

export default defineCommitConfig({
	runFormatter: false, // do not run formatter,  use \`true\` to format before committing 
});
`;
