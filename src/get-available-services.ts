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
import { isNonEmptyString } from "./utils/basic-utils";
import omit from "lodash.omit";
export type { DiscoveryService } from "./types/api/get-discovery-api-services";

export interface GetAvailableServicesResponse {
    countries: DiscoveryServiceCountry[];
    serviceGroups: DiscoveryServiceGroup[];
    services: DiscoveryService[];
}

const getAvailableServices = async (
    sdkConfig: SDKConfiguration,
    contractId?: string
): Promise<GetAvailableServicesResponse> => {
    if (contractId !== undefined && !isNonEmptyString(contractId)) {
        throw new TypeValidationError("Contract Id must be a string.");
    }

    const response = await net
        .get(`${sdkConfig.baseUrl}discovery/services`, {
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
