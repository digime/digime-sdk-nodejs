/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";
import { DiscoveryAPIServicesData } from "../types/external/discovery-api-services";

/**
 * `<instance>.getAvailableServices()` input parameters
 */
export const GetAvailableServicesParameters = z.object({
    /** URL to be called after authorization is done */
    contractId: z.string().optional(),

    /** Extra state data to be passed back after the authorization flow */
    signal: z.instanceof(AbortSignal).optional(),
});

export type GetAvailableServicesParameters = z.infer<typeof GetAvailableServicesParameters>;

/**
 * `<instance>.getAvailableServices()` return type
 */
export type GetAvailableServicesReturn = DiscoveryAPIServicesData;
