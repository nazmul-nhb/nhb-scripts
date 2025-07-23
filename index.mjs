// @ts-check

export { defineScriptConfig } from './lib/define-config.mjs';

export { fixTypeExports } from './lib/fix-types-exports.mjs';

export { fixJsExtensions, fixTsExtensions } from './lib/fix-imports.mjs';

export { runFormatter } from './lib/prettier-formatter.mjs';

export { expressMongooseZodTemplate } from './templates/express-mongoose-zod.mjs';