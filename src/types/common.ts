/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import * as t from "io-ts";

export interface ContractDetails {
    contractId: string;
    privateKey: string;
    redirectUri: string;
}

export const ContractDetailsCodec: t.Type<ContractDetails> = t.type({
    contractId: t.string,
    privateKey: t.string,
    redirectUri: t.string,
});

export interface CAScope {
    timeRanges?: TimeRange[];
    serviceGroups?: ServiceGroup[];
}

export interface TimeRange {
    from?: number;
    last?: string;
    to?: number;
}

export interface ServiceGroup {
    id: number;
    serviceTypes: Service[];
}

export interface Service {
    id: number;
    serviceObjectTypes: ServiceObject[];
}

export interface ServiceObject {
    id: number;
}

export interface DiscoveryService {
    id: number;
    name: string;
    serviceGroups: Array<{ id: number }>;
    serviceId: number;
    platform: Record<
        string,
        {
            availability: string;
            currentStatus: string;
        }
    >;
}

export interface DiscoveryServiceGroup {
    id: number;
    name: string;
}

export interface DiscoveryApiServicesData {
    serviceGroups: DiscoveryServiceGroup[];
    services: DiscoveryService[];
}
