export const moduleConfigBoilerplate = `// @ts-check

import { defineModuleConfig } from 'nhb-scripts';

export default defineModuleConfig({
    destination: 'src/app/modules', // optional, default: "src/app/modules"
    template: 'my-template1', // or omit, it's not necessary as cli will prompt to choose
    force: false, // true if you want to override the existing module
    customTemplates: {
        'my-template1': {
            destination: 'src/app', // optional, will prioritize inputs from cli
            files: [
                { name: 'index.ts', content: '// index' },
                { name: 'server.ts', content: '// server' }]
        },
        'my-template2': {
            destination: 'src/features', // optional, will prioritize inputs from cli
            files: [
                { name: 'index.ts', content: '// content' },
                { name: 'dummy.js', content: '// dummy' }
            ]
        },
    },
    // Optional hooks to inspect or execute something at the beginning or after the module generation
    hooks: {
        onGenerate(name) {
            console.log('✅ Generating:', name);
        },
        onComplete(name) {
            console.log('✅ Complete:', name);
        }
    }
});
`;
