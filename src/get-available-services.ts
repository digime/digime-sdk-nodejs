/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { net } from "./net";
import {
    assertIsDiscoveryApiServicesData,
    DiscoveryServiceCountry,
    DiscoveryServiceGroup,
    DiscoveryService,
} from "./types/api/get-discovery-api-services";
import { SDKConfiguration } from "./types/sdk-configuration";
import { TypeValidationError } from "./errors";
import * as t from "io-ts";
import omit from "lodash.omit";
export type { DiscoveryService } from "./types/api/get-discovery-api-services";

export interface GetAvailableServicesResponse {
    countries: DiscoveryServiceCountry[];
    serviceGroups: DiscoveryServiceGroup[];
    services: DiscoveryService[];
}

export interface GetAvailableServicesOptions {
    /**
     * Pass contractId to scope list of services allowed for your contract
     */
    contractId?: string;

    /**
     * If set to true response will include services that are sample only. Default is false.
     */
    includeSampleDataOnlySources?: boolean;
}

const NonEmptyString = t.refinement(t.string, (s) => s.length > 0, "NonEmptyString");

export const GetAvailableServicesOptionsCodec: t.Type<GetAvailableServicesOptions> = t.partial({
    contractId: t.union([t.undefined, NonEmptyString]),
    includeSampleDataOnlySources: t.boolean,
});

const getAvailableServices = async (
    options: GetAvailableServicesOptions,
    sdkConfig: SDKConfiguration
): Promise<GetAvailableServicesResponse> => {
    if (!GetAvailableServicesOptionsCodec.is(options)) {
        throw new TypeValidationError(
            "Parameters failed validation. contractId if passed should be string and includeSampleDataOnlySources if passed should be boolean"
        );
    }

    const { contractId, includeSampleDataOnlySources } = options;

    let url = `${sdkConfig.baseUrl}discovery/services`;

    if (typeof includeSampleDataOnlySources !== "undefined") {
        url = url + `?includeSampleDataOnlySources=${includeSampleDataOnlySources.toString()}`;
    }

    const response = await net
        .get(url, {
            headers: { contractId },
        })
        .json();

    assertIsDiscoveryApiServicesData(response);

    return {
        ...response.data,
        services: response.data.services.map((service) => formatService(service)),
    };
};

const formatService = (service: DiscoveryService): DiscoveryService => {
    // Remove redundant fields that are not relevant to externals
    return omit(service, [
        "authorisation",
        "platform",
        "providerId",
        "reference",
        "serviceId",
        "sync",
    ]) as DiscoveryService;
};

export { getAvailableServices };
