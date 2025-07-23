// @ts-check

import { capitalizeString, pluralizer } from 'nhb-toolbox';

/** @type {import('../types/index.d.ts').expressMongooseZodTemplate} */
export function expressMongooseZodTemplate(moduleName) {
	const capModule = capitalizeString(moduleName);
	const pluralModule = pluralizer.toPlural(capModule);

	return [
		{
			name: `${moduleName}.routes.ts`,
			content: `
import { Router } from 'express';
import { ${moduleName}Controllers } from './${moduleName}.controllers';
import validateRequest from '../../middlewares/validateRequest';
import { ${moduleName}Validations } from './${moduleName}.validation';

const router = Router();

router.post(
	'/',
	validateRequest(${moduleName}Validations.creationSchema),
	${moduleName}Controllers.create${capModule},
);

router.get('/', ${moduleName}Controllers.getAll${pluralModule});

export const ${moduleName}Routes = router;
            `,
		},
		{
			name: `${moduleName}.controllers.ts`,
			content: `
import catchAsync from '../../utilities/catchAsync';
import sendResponse from '../../utilities/sendResponse';
import { ${moduleName}Services } from './${moduleName}.services';

const create${capModule} = catchAsync(async (req, res) => {
	const new${capModule} = await ${moduleName}Services.create${capModule}InDB(req.body);

	sendResponse(res, '${capModule}', 'POST', new${capModule});
});
            
const getAll${pluralModule} = catchAsync(async (_req, res) => {
    const ${moduleName}s = await ${moduleName}Services.getAll${pluralModule}FromDB();

    sendResponse(res, '${capModule}', 'GET', ${moduleName}s);
});

export const ${moduleName}Controllers = { getAll${pluralModule} };
            `,
		},
		{
			name: `${moduleName}.services.ts`,
			content: `
import { QueryBuilder } from '../../classes/QueryBuilder';
import { ${capModule} } from './${moduleName}.model';
import type { I${capModule} } from './${moduleName}.types';

const create${capModule}InDB = async (payload: I${capModule}) => {
	const new${moduleName} = await ${capModule}.create(payload);

	return new${moduleName};
};

const getAll${pluralModule}FromDB = async (query?: Record<string, unknown>) => {
    const ${moduleName}Query = new QueryBuilder(${capModule}.find(), query).sort();
    // const ${moduleName}s = await ${capModule}.find({});

    const ${moduleName}s = await ${moduleName}Query.modelQuery;

    return ${moduleName}s;
};

export const ${moduleName}Services = { create${capModule}InDB, getAll${pluralModule}FromDB };
            `,
		},
		{
			name: `${moduleName}.model.ts`,
			content: `
import { Schema, model } from 'mongoose';
import type { I${capModule}Doc } from './${moduleName}.types';

const ${moduleName}Schema = new Schema<I${capModule}Doc>(
    {
        // Define ${moduleName}Schema here
    },
	{
		timestamps: {
			createdAt: 'created_at',
			updatedAt: 'updated_at',
		},
		versionKey: false,
	},
);

export const ${capModule} = model<I${capModule}Doc>('${pluralModule}', ${moduleName}Schema);
            `,
		},
		{
			name: `${moduleName}.validation.ts`,
			content: `
import { z } from 'zod';

const creationSchema = z
    .object({})
    .strict();

export const ${moduleName}Validations = { creationSchema };
            `,
		},
		{
			name: `${moduleName}.types.ts`,
			content: `
import type { Document, Types } from 'mongoose';

export interface I${capModule} {
    // Define I${capModule} interface
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
