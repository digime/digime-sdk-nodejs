/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";

export const ErrorWithCauseCode = z.object({
    cause: z.object({
        code: z.string(),
    }),
});

export type ErrorWithCauseCode = z.infer<typeof ErrorWithCauseCode>;
