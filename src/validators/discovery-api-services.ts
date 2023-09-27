/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";

/**
 * Discovery API Services - Data - Country
 */
export const DiscoveryAPIServicesDataCountry = z.object({
    code: z.string(),
    id: z.number(),
    name: z.string(),
});

export type DiscoveryAPIServicesDataCountry = z.infer<typeof DiscoveryAPIServicesDataCountry>;

/**
 * Discovery API Services - Data - Service Group
 */
export const DiscoveryAPIServicesDataServiceGroup = z.object({
    id: z.number(),
    name: z.string(),
});

export type DiscoveryAPIServicesDataServiceGroup = z.infer<typeof DiscoveryAPIServicesDataServiceGroup>;

/**
 * Discovery API Services - Data - Resource
 */
const DiscoveryAPIServicesDataResource = z.object({
    url: z.string(),
    mimetype: z.string(),
    type: z.number(),
    height: z.number().optional(),
    width: z.number().optional(),
});

export type DiscoveryAPIServicesDataResource = z.infer<typeof DiscoveryAPIServicesDataResource>;

/**
 * Discovery API Services - Data - Service
 */
export const DiscoveryAPIServicesDataService = z.object({
    id: z.number(),
    name: z.string(),
    countries: z.array(z.object({ id: z.number() })).optional(),
    serviceGroups: z.array(z.object({ id: z.number() })),
    publishedStatus: z.string(),
    publishedDate: z.number(),
    resources: z.array(DiscoveryAPIServicesDataResource),
});

export type DiscoveryAPIServicesDataService = z.infer<typeof DiscoveryAPIServicesDataService>;

/**
 * Discovery API Services - Data
 */
const DiscoveryAPIServicesData = z.object({
    countries: z.array(DiscoveryAPIServicesDataCountry),
    serviceGroups: z.array(DiscoveryAPIServicesDataServiceGroup),
    services: z.array(DiscoveryAPIServicesDataService),
});

export type DiscoveryAPIServicesData = z.infer<typeof DiscoveryAPIServicesData>;

/**
 * Discovery API Services - Response
 */

export const DiscoveryAPIServicesResponse = z.object({
    data: DiscoveryAPIServicesData,
});

export type DiscoveryAPIServicesResponse = z.infer<typeof DiscoveryAPIServicesResponse>;
