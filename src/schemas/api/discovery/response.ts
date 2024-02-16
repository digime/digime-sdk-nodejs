/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";
import { DiscoveryApiSource } from "./source";
import { DiscoveryApiServiceGroup } from "./service-group";
import { DiscoveryApiCountry } from "./country";

/**
 * Discovery API Services - Response
 */

export const DiscoveryApiServicesResponse = z.object({
    data: z.object({
        countries: z.array(DiscoveryApiCountry),
        serviceGroups: z.array(DiscoveryApiServiceGroup),
        services: z.array(DiscoveryApiSource),
    }),
});

export type DiscoveryApiServicesResponse = z.infer<typeof DiscoveryApiServicesResponse>;
