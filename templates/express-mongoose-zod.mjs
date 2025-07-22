// @ts-check

import { capitalizeString, pluralizer } from 'nhb-toolbox';

/**
 * @param {string} module
 * @returns {Array<{ name: string, content: string }>}
 */
export function expressMongooseZodTemplate(module) {
	const capModule = capitalizeString(module);

	return [
		{
			name: `${module}.routes.ts`,
			content: `
import { Router } from 'express';
import { ${module}Controllers } from './${module}.controllers';

const router = Router();

router.get('/', ${module}Controllers.getAll${capModule}s);

export const ${module}Routes = router;
            `,
		},
		{
			name: `${module}.controllers.ts`,
			content: `
import catchAsync from '../../utilities/catchAsync';
import sendResponse from '../../utilities/sendResponse';
import { ${module}Services } from './${module}.services';
            
const getAll${capModule}s = catchAsync(async (_req, res) => {
    const ${module}s = await ${module}Services.getAll${capModule}sFromDB();

    sendResponse(res, '${capModule}', 'GET', ${module}s);
});

export const ${module}Controllers = { getAll${capModule}s };
            `,
		},
		{
			name: `${module}.services.ts`,
			content: `
import { QueryBuilder } from '../../classes/QueryBuilder';
import { ${capModule} } from './${module}.model';

const getAll${capModule}sFromDB = async (query?: Record<string, unknown>) => {
    const ${module}Query = new QueryBuilder(${capModule}.find(), query).sort();
    // const ${module}s = await ${capModule}.find({});

    const ${module}s = await ${module}Query.modelQuery;

    return ${module}s;
};

export const ${module}Services = { getAll${capModule}sFromDB };
            `,
		},
		{
			name: `${module}.model.ts`,
			content: `
import { Schema, model } from 'mongoose';
import type { I${capModule}Doc } from './${module}.types';

const ${module}Schema = new Schema<I${capModule}Doc>(
    {
        // Define schema here
    },
	{
		timestamps: {
			createdAt: 'created_at',
			updatedAt: 'updated_at',
		},
		versionKey: false,
	},
);

export const ${capModule} = model<I${capModule}Doc>('${pluralizer.toPlural(capModule)}', ${module}Schema);
            `,
		},
		{
			name: `${module}.validation.ts`,
			content: `
import { z } from 'zod';

const creationSchema = z
    .object({})
    .strict();

export const ${module}Validations = { creationSchema };
            `,
		},
		{
			name: `${module}.types.ts`,
			content: `
import type { Document, Types } from 'mongoose';

export interface I${capModule} {
    // Define interface
    property: "Define types";
}

export interface I${capModule}Doc extends I${capModule}, Document {
	_id: Types.ObjectId;
	created_at: string;
	updated_at: string;
}
            `,
		},
	];
}
