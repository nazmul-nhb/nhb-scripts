
import { z } from 'zod';

const creationSchema = z
    .object({})
    .strict();

export const helloValidations = { creationSchema };
            