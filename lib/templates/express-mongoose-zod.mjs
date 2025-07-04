// @ts-check

import { capitalizeString } from 'nhb-toolbox';

/**
 * @param {string} module
 * @returns {Array<{ name: string, content: string }>}
 */
export function expressMongooseZodTemplate(module) {
    return [
        {
            name: `${module}.routes.ts`,
            content: `
import { Router } from 'express';
import { ${module}Controllers } from './${module}.controllers';

const router = Router();

router.get('/', ${module}Controllers.getAll${capitalizeString(module)}s);

export const ${module}Routes = router;
            `,
        },
        {
            name: `${module}.controllers.ts`,
            content: `
import catchAsync from '../../utilities/catchAsync';
import sendResponse from '../../utilities/sendResponse';
import { ${module}Services } from './${module}.services';
            
const getAll${capitalizeString(module)}s = catchAsync(async (_req, res) => {
    const ${module}s = await ${module}Services.getAll${capitalizeString(module)}sFromDB();

    sendResponse(res, '${capitalizeString(module)}', 'GET', ${module}s);
});

export const ${module}Controllers = { getAll${capitalizeString(module)}s };
            `,
        },
        {
            name: `${module}.services.ts`,
            content: `
import { QueryBuilder } from '../../classes/QueryBuilder';
import { ${capitalizeString(module)} } from './${module}.model';

const getAll${capitalizeString(module)}sFromDB = async (query?: Record<string, unknown>) => {
    const ${module}Query = new QueryBuilder(${capitalizeString(module)}.find(), query).sort();
    // const ${module}s = await ${capitalizeString(module)}.find({});

    const ${module}s = await ${module}Query.modelQuery;

    return ${module}s;
};

export const ${module}Services = { getAll${capitalizeString(module)}sFromDB };
            `,
        },
        {
            name: `${module}.model.ts`,
            content: `
import { Schema, model } from 'mongoose';
import type { I${capitalizeString(module)}Doc } from './${module}.types';

const ${module}Schema = new Schema<I${capitalizeString(module)}Doc>(
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

export const ${capitalizeString(module)} = model<I${capitalizeString(module)}Doc>('${capitalizeString(module)}', ${module}Schema);
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

export interface I${capitalizeString(module)} {
    // Define interface
    property: "Define types";
}

export interface I${capitalizeString(module)}Doc extends I${capitalizeString(module)}, Document {
	_id: Types.ObjectId;
	created_at: string;
	updated_at: string;
}
            `,
        },
    ];
}
