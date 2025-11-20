// @ts-check

export { defineScriptConfig } from './lib/define-config.mjs';

export { fixTypeExports } from './lib/fix-types-exports.mjs';

export { fixJsExtensions, fixTsExtensions } from './lib/fix-imports.mjs';

export { generateModule } from './lib/module-generator.mjs';

export { updateCollection, updateRoutes } from './lib/updateTemplate.mjs';

export { runFormatter } from './lib/prettier-formatter.mjs';

export { expressMongooseZodTemplate } from './templates/express-mongoose-zod.mjs';

export { parsePackageJson, writeToPackageJson } from './lib/package-json-utils.mjs';

export { detectPackageManager } from './lib/detect-package-manager.mjs';

export { estimator } from './lib/estimator.mjs';

export { runExeca } from './lib/run-execa.mjs';

export {
	addPipeOnLeft,
	mimicClack,
	showCancelMessage,
	validateStringInput,
	normalizeBooleanResult,
	normalizeStringResult,
} from './lib/clack-utils.mjs';
