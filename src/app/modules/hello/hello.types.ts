
import type { Document, Types } from 'mongoose';

export interface IHello {
    // Define interface
    property: "Define types";
}

export interface IHelloDoc extends IHello, Document {
	_id: Types.ObjectId;
	created_at: string;
	updated_at: string;
}
            