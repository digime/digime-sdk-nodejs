/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

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
