
import type { Document, Types } from 'mongoose';

export interface I555 {
    // Define interface
    property: "Define types";
}

export interface I555Doc extends I555, Document {
	_id: Types.ObjectId;
	created_at: string;
	updated_at: string;
}
            