/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";

export const ApiErrorResponse = z.object({
    code: z.string(),
    message: z.string(),
    reference: z.string(),
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponse>;
