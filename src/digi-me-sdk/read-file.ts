/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";

export const ReadFileOptions = z.object({
    sessionKey: z.string(),
    fileName: z.string(),
    signal: z.instanceof(AbortSignal).optional(),
});

export type ReadFileOptions = z.infer<typeof ReadFileOptions>;
