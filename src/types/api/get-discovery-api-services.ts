/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import * as t from "io-ts";
import { codecAssertion, CodecAssertion } from "../../utils/codec-assertion";
import { DiscoveryApiServicesData, DiscoveryService, DiscoveryServiceGroup } from "../common";

export const DiscoverySourceCodec: t.Type<DiscoveryService> = t.strict({
    id: t.number,
    name: t.string,
    serviceGroups: t.array(
        t.strict({
            id: t.number,
        }),
    ),
    serviceId: t.number,
    platform: t.record(
        t.string,
        t.strict({
            availability: t.string,
            currentStatus: t.string,
        }),
    ),
});

export const DiscoverySourceGroupCodec: t.Type<DiscoveryServiceGroup> = t.strict({
    id: t.number,
    name: t.string,
});

export const DiscoveryApiServicesDataCodec: t.Type<DiscoveryApiServicesData> = t.strict({
    serviceGroups: t.array(DiscoverySourceGroupCodec),
    services: t.array(DiscoverySourceCodec),
});

export const DiscoveryApiServicesDataResponseCodec: t.Type<DiscoveryApiServicesDataResponse> = t.strict({
    data: DiscoveryApiServicesDataCodec,
});

export interface DiscoveryApiServicesDataResponse {
    data: DiscoveryApiServicesData;
}

export const assertIsDiscoveryApiServicesData: CodecAssertion<DiscoveryApiServicesDataResponse> =
    codecAssertion(DiscoveryApiServicesDataResponseCodec);
