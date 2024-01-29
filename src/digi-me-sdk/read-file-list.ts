/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";

/**
 * `<instance>.readFileList()` input parameters
 */
export const ReadFileListParameters = z.object({
    /** SessionKey of the session you wish to read the file list for */
    sessionKey: z.string(),

    /** AbortSignal to abort this operation */
    signal: z.instanceof(AbortSignal).optional(),
});

export type ReadFileListParameters = z.infer<typeof ReadFileListParameters>;
