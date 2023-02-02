/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import * as t from "io-ts";
import { codecAssertion, CodecAssertion } from "../../utils/codec-assertion";

interface DiscoveryResource {
    height?: number;
    mimetype: string;
    type: number;
    url: string;
    width?: number;
}

export interface DiscoveryService {
    id: number;
    name: string;
    serviceGroups: Array<{ id: number }>;
    publishedStatus: string;
    publishedDate: number;
    resources: DiscoveryResource[];
    countries?: Array<{ id: number }>;
    [key: string]: unknown;
}

export interface DiscoveryServiceCountry {
    id: number;
    name: string;
    code: string;
}

export interface DiscoveryServiceGroup {
    id: number;
    name: string;
}

export interface DiscoveryApiServicesData {
    countries: DiscoveryServiceCountry[];
    serviceGroups: DiscoveryServiceGroup[];
    services: DiscoveryService[];
}

const DiscoveryResourceCodec: t.Type<DiscoveryResource> = t.intersection([
    t.type({
        url: t.string,
        mimetype: t.string,
        type: t.number,
    }),
    t.partial({
        height: t.number,
        width: t.number,
    }),
]);

export const DiscoveryServiceCodec: t.Type<DiscoveryService> = t.intersection([
    t.type({
        id: t.number,
        name: t.string,
        serviceGroups: t.array(
            t.strict({
                id: t.number,
            })
        ),
        publishedStatus: t.string,
        publishedDate: t.number,
        resources: t.array(DiscoveryResourceCodec),
    }),
    t.partial({
        countries: t.array(
            t.strict({
                id: t.number,
            })
        ),
    }),
]);

export const DiscoveryServiceCountryCodec: t.Type<DiscoveryServiceCountry> = t.strict({
    code: t.string,
    id: t.number,
    name: t.string,
});

export const DiscoverySourceGroupCodec: t.Type<DiscoveryServiceGroup> = t.strict({
    id: t.number,
    name: t.string,
});

export const DiscoveryApiServicesDataCodec: t.Type<DiscoveryApiServicesData> = t.strict({
    countries: t.array(DiscoveryServiceCountryCodec),
    serviceGroups: t.array(DiscoverySourceGroupCodec),
    services: t.array(DiscoveryServiceCodec),
});

export const DiscoveryApiServicesDataResponseCodec: t.Type<DiscoveryApiServicesDataResponse> = t.strict({
    data: DiscoveryApiServicesDataCodec,
});

export interface DiscoveryApiServicesDataResponse {
    data: DiscoveryApiServicesData;
}

export const assertIsDiscoveryApiServicesData: CodecAssertion<DiscoveryApiServicesDataResponse> = codecAssertion(
    DiscoveryApiServicesDataResponseCodec
);
