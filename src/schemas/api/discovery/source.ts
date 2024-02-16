/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import z from "zod";

const DiscoveryApiResource = z.object({
    url: z.string(),
    mimetype: z.string(),
    type: z.number(),
    height: z.number().optional(),
    width: z.number().optional(),
});

export const DiscoveryApiSource = z.object({
    id: z.number(),
    name: z.string(),
    countries: z.array(z.object({ id: z.number() })).optional(),
    serviceGroups: z.array(z.object({ id: z.number() })),
    publishedStatus: z.string(),
    publishedDate: z.number(),
    resources: z.array(DiscoveryApiResource),
});

export type DiscoveryApiSource = z.infer<typeof DiscoveryApiSource>;
