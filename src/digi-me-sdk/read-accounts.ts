/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";

/**
 * `<instance>.readAccounts()` input parameters
 */
export const ReadAccountsParameters = z.object({
    /** AbortSignal to abort this operation */
    signal: z.instanceof(AbortSignal).optional(),
});

export type ReadAccountsParameters = z.infer<typeof ReadAccountsParameters>;
