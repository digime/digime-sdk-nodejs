/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import { net } from "./net";
import { DiscoveryApiServicesData } from "./types/common";
import { assertIsDiscoveryApiServicesData } from "./types/api/get-discovery-api-services";
import { SDKConfiguration } from "./types/sdk-configuration";

const getAvailableServices = async (
    sdkConfig: SDKConfiguration,
    contractId?: string
): Promise<DiscoveryApiServicesData> => {
    const response = await net
        .get(`${sdkConfig.baseUrl}discovery/services`, {
            headers: { contractId },
        })
        .json();

    assertIsDiscoveryApiServicesData(response);

    return response.data;
};

export { getAvailableServices };
