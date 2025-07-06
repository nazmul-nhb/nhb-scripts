// @ts-check

export const formatConfigBoilerplate = `// @ts-check

import { defineFormatConfig } from 'nhb-scripts';
    
export default defineFormatConfig({
    args: ['--write'], // prettier arguments
    files: ['.'], // scan everything
    ignorePath: '.prettierignore', // ignore files/folders mentioned in this file
});
`;
