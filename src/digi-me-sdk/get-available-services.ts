/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";
import type { DiscoveryAPIServicesData } from "../types/external/discovery-api-services";

/**
 * `<instance>.getAvailableServices()` input parameters
 */
export const GetAvailableServicesParameters = z.object({
    /** Contract ID to filter sources by */
    contractId: z.string().optional(),

    /** AbortSignal to abort this operation */
    signal: z.instanceof(AbortSignal).optional(),
});

export type GetAvailableServicesParameters = z.infer<typeof GetAvailableServicesParameters>;

/**
 * `<instance>.getAvailableServices()` return type
 */
export type GetAvailableServicesReturn = DiscoveryAPIServicesData;
