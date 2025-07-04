
import { Schema, model } from 'mongoose';
import type { IHelloDoc } from './hello.types';

const helloSchema = new Schema<IHelloDoc>(
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

export const Hello = model<IHelloDoc>('Hello', helloSchema);
            