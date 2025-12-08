export const CONFIG_BOILERPLATE = /* javascript */ `// @ts-check

import { defineScriptConfig, expressMongooseZodTemplate } from 'nhb-scripts';

export default defineScriptConfig({
    format: {
        args: ['--write'],
        files: ['.'],
        ignorePath: '.prettierignore',
    },
    commit: {
        runFormatter: false, // do not run formatter,  use \`true\` to format before committing 
    },
    count: {
        defaultPath: '.',
        excludePaths: ['node_modules', 'dist', 'build'],
    },
    module: {
        destination: 'src/modules', // optional, default: "src/modules"
        defaultTemplate: 'my.template1', // selected by default, must match with the keys of \`templates\` object
        force: false, // \`true\` if you want to override the existing module
        templates: {
            'express-mongoose-zod': {
                createFolder: true,
                destination: 'src/app/modules',
                files: expressMongooseZodTemplate, // built-in module : function that receives moduleName as argument and creates pre-defined files and contents
            },
        },
    },
});
`;
