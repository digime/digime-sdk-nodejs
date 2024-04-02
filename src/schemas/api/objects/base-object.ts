/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";

export const BaseObject = z
    .object({
        entityid: z.string(),
        accountentityid: z.string(),
        createddate: z.number().optional(),
    })
    .passthrough();

export type BaseObject = z.infer<typeof BaseObject>;
