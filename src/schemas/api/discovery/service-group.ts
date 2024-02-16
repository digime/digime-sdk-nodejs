/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";

export const DiscoveryApiServiceGroup = z.object({
    id: z.number(),
    name: z.string(),
});

export type DiscoveryApiServiceGroup = z.infer<typeof DiscoveryApiServiceGroup>;
