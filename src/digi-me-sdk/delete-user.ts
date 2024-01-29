/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";

/**
 * `<instance>.deleteUser()` input parameters
 */
export const DeleteUserParameters = z.object({
    /** AbortSignal to abort this operation */
    signal: z.instanceof(AbortSignal).optional(),
});

export type DeleteUserParameters = z.infer<typeof DeleteUserParameters>;
