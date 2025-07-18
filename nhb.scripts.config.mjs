// @ts-check

import { defineScriptConfig, fixJsExtensions, fixTypeExports } from "./index.mjs";

export default defineScriptConfig({
    format: {
        args: ['--write'],
        files: ['lib', 'bin', 'templates', 'types'],
        ignorePath: '.prettierignore',
    },
    commit: {
        runFormatter: true,
    },
    count: {
        defaultPath: 'lib',
        excludePaths: ['node_modules', 'dist', 'build']
    },
    build: {
        distFolder: 'dist',
        deleteDist: true,
        commands: [
            { cmd: 'tsc', args: ['-p', 'tsconfig.cjs.json'] },
            {
                cmd: 'tsc',
                args: ['-p', 'tsconfig.esm.json'],
                options: { stdio: 'inherit' }
            }
        ],
        after: [
            async () => await fixJsExtensions('dist/esm'),
            () => fixTypeExports({
                distPath: 'dist/dts',
                packageJsonPath: 'package.json',
                typeFileCandidates: ['types.d.ts', 'interfaces.d.ts'],
                extraPatterns: [
                    { pattern: 'plugins', folderName: 'plugins' },
                ]
            }),
        ],
    },
    module: {
        destination: 'src/modules', // optional, default: "src/modules"
        template: 'my-template1', // or omit, it's not necessary as cli will prompt to choose
        force: false, // `true` if you want to override the existing module
        customTemplates: {
            'my-template1': {
                createFolder: true, // if `false` does not create folder with the module name from cli
                destination: 'src/app', // optional, will prioritize inputs from cli
                // Use dynamic moduleName in filenames and contents
                files: (moduleName) => [
                    { name: `${moduleName}.controllers.ts`, content: `// controllers for ${moduleName}` },
                    { name: `${moduleName}.services.ts`, content: `// services for ${moduleName}` }
                ]
            },
            'my-template2': {
                destination: 'src/features', // optional, will prioritize inputs from cli
                // Use static file list with contents
                files: [
                    { name: 'index.ts', content: '// content' },
                    { name: 'dummy.js', content: '// dummy' }
                ]
            },
        },
        // Optional hooks to inspect or execute something at the beginning or after the module generation
        hooks: {
            onGenerate(name) {
                console.log('➡️ Generating:', name);
            },
            onComplete(name) {
                console.log('✅ Complete:', name);
            }
        }
    }
});
