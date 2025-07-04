
import { Schema, model } from 'mongoose';
import type { I555Doc } from './555.types';

const 555Schema = new Schema<I555Doc>(
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

export const 555 = model<I555Doc>('555', 555Schema);
            