// @ts-check

import { defineScriptConfig } from "./index.mjs";

export default defineScriptConfig({
    format: {
        args: ['--write'],
        files: ['lib', 'bin', 'templates'],
        ignorePath: '.prettierignore',
    },
    commit: {
        runFormatter: true, // do not run formatter,  use `true` to format before committing 
    },
    count: {
        defaultPath: 'lib',
        excludePaths: ['node_modules', 'dist', 'build']
    },
    module: {
        destination: 'src/modules', // optional, default: "src/modules"
        template: 'my-template1', // or omit, it's not necessary as cli will prompt to choose
        // force: false, // true if you want to override the existing module
        createFolder: true, // if `false` does not create folder with the module name from cli
        customTemplates: {
            'my-template1': {
                createFolder: true, // if `false` does not create folder with the module name from cli
                destination: 'src/app', // optional, will prioritize inputs from cli
                // Use dynamic moduleName in filenames and contents
                files: (moduleName) => [
                    {
                        name: `${moduleName}.controllers.ts`,
                        content: `// controllers for ${moduleName}`,
                    },
                    {
                        name: `${moduleName}.services.ts`,
                        content: `// services for ${moduleName}`,
                    },
                ],
            },
            'my-template2': {
                destination: 'src/features', // optional, will prioritize inputs from cli
                // Use static file list
                files: [
                    { name: 'index.ts', content: '// content' },
                    { name: 'dummy.js', content: '// dummy' },
                ],
            },
        },
        // Optional hooks to inspect or execute something at the beginning or after the module generation
        hooks: {
            onGenerate(name) {
                console.log('➡️ Generating:', name);
            },
            onComplete(name) {
                console.log('✅ Complete:', name);
            },
        },
    }
})