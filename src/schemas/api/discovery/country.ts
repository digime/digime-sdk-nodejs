/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";

export const DiscoveryApiCountry = z.object({
    code: z.string(),
    id: z.number(),
    name: z.string(),
});

export type DiscoveryApiCountry = z.infer<typeof DiscoveryApiCountry>;
