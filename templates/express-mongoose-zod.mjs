// @ts-check

import { capitalizeString, pluralizer } from 'nhb-toolbox';

/** @type {import('../types/index.d.ts').expressMongooseZodTemplate} */
export function expressMongooseZodTemplate(moduleName) {
	const capModule = capitalizeString(moduleName);
	const pluralModule = pluralizer.toPlural(moduleName);
	const pluralCapModule = pluralizer.toPlural(capModule);

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

router.get('/', ${moduleName}Controllers.getAll${pluralCapModule});

router.get('/:id', ${moduleName}Controllers.getSingle${capModule});

router.patch(
	'/:id',
	validateRequest(${moduleName}Validations.updateSchema),
	${moduleName}Controllers.update${capModule},
);

router.delete('/:id', ${moduleName}Controllers.delete${capModule});

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
            
const getAll${pluralCapModule} = catchAsync(async (_req, res) => {
    const ${pluralModule} = await ${moduleName}Services.getAll${pluralCapModule}FromDB();

    sendResponse(res, '${capModule}', 'GET', ${pluralModule});
});

const getSingle${capModule} = catchAsync(async (req, res) => {
	const ${moduleName} = await ${moduleName}Services.getSingle${capModule}FromDB(req?.params?.id);

	sendResponse(res, '${capModule}', 'GET', ${moduleName});
});

const update${capModule} = catchAsync(async (req, res) => {
	const ${moduleName} = await ${moduleName}Services.update${capModule}InDB(req?.params?.id, req?.body);

	sendResponse(res, '${capModule}', 'PATCH', ${moduleName});
});

const delete${capModule} = catchAsync(async (req, res) => {
	await ${moduleName}Services.delete${capModule}FromDB(req?.params?.id);

	sendResponse(res, '${capModule}', 'DELETE');
});

export const ${moduleName}Controllers = {
	create${capModule},
	getAll${pluralCapModule},
	getSingle${capModule},
	update${capModule},
	delete${capModule},
};
            `,
		},
		{
			name: `${moduleName}.services.ts`,
			content: `
import { ErrorWithStatus } from '../../classes/ErrorWithStatus';
import { QueryBuilder } from '../../classes/QueryBuilder';
import { STATUS_CODES } from '../../constants/index';
import { ${capModule} } from './${moduleName}.model';
import type { I${capModule} } from './${moduleName}.types';

const create${capModule}InDB = async (payload: I${capModule}) => {
	const new${capModule} = await ${capModule}.create(payload);

	return new${capModule};
};

const getAll${pluralCapModule}FromDB = async (query?: Record<string, unknown>) => {
    const ${moduleName}Query = new QueryBuilder(${capModule}.find(), query).sort();
    // const ${pluralModule} = await ${capModule}.find({});

    const ${pluralModule} = await ${moduleName}Query.modelQuery;

    return ${pluralModule};
};

const getSingle${capModule}FromDB = async (id: string) => {
	const ${moduleName} = await ${capModule}.find${capModule}ById(id);

	return ${moduleName};
};

const update${capModule}InDB = async (id: string, payload: Partial<I${capModule}>) => {
	const updated${capModule} = await ${capModule}.findOneAndUpdate({ _id: id }, payload, {
		runValidators: true,
		new: true,
	});

	if (!updated${capModule}) {
		throw new ErrorWithStatus(
			'Not Updated Error',
			\`Cannot update specified ${moduleName} with ID \${ id }!\`,
			STATUS_CODES.INTERNAL_SERVER_ERROR,
			'update_${moduleName}',
		);
	}

	return updated${capModule};
};

const delete${capModule}FromDB = async (id: string) => {
	const result = await ${capModule}.deleteOne({ _id: id });

	if (result.deletedCount < 1) {
		throw new ErrorWithStatus(
			'Delete Failed Error',
			\`Failed to delete ${moduleName} with ID \${ id }!\`,
			STATUS_CODES.INTERNAL_SERVER_ERROR,
			'delete_${moduleName}',
		);
	}
};

export const ${moduleName}Services = {
	create${capModule}InDB,
	getAll${pluralCapModule}FromDB,
	getSingle${capModule}FromDB,
	update${capModule}InDB,
	delete${capModule}FromDB,
};
            `,
		},
		{
			name: `${moduleName}.model.ts`,
			content: `
import { Schema, model } from 'mongoose';
import type { I${capModule}Doc, I${capModule}Model } from './${moduleName}.types';
import { ErrorWithStatus } from '../../classes/ErrorWithStatus';
import { STATUS_CODES } from '../../constants/index';

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

${moduleName}Schema.statics.find${capModule}ById = async function (id: string) {
	if (!id) {
		throw new ErrorWithStatus(
			'Bad Request',
			'Please provide a valid ID!',
			STATUS_CODES.BAD_REQUEST,
			'${moduleName}',
		);
	}

	const ${moduleName} = await this.findById(id);

	if (!${moduleName}) {
		throw new ErrorWithStatus(
			'Not Found Error',
			\`No ${moduleName} found with ID \${ id }!\`,
			STATUS_CODES.NOT_FOUND,
			'${moduleName}',
		);
	}

	return ${moduleName};
};

export const ${capModule} = model<I${capModule}Doc, I${capModule}Model>('${pluralCapModule}', ${moduleName}Schema);
            `,
		},
		{
			name: `${moduleName}.validation.ts`,
			content: `
import { z } from 'zod';

const creationSchema = z
    .object({})
    .strict();

const updateSchema = creationSchema.optional();

export const ${moduleName}Validations = { creationSchema, updateSchema };
            `,
		},
		{
			name: `${moduleName}.types.ts`,
			content: `
import type { Document, Model, Types } from 'mongoose';

export interface I${capModule} {
    // Define I${capModule} interface
    property: "Define types";
}

export interface I${capModule}Doc extends I${capModule}, Document {
	_id: Types.ObjectId;
	created_at: string;
	updated_at: string;
}

export interface I${capModule}Model extends Model<I${capModule}Doc> {
	find${capModule}ById: (id: string) => Promise<I${capModule}Doc>;
}
            `,
		},
	];
}
