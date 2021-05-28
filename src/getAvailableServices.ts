/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import { net } from "./net";
import { InternalProps } from "./sdk";
import { DiscoveryApiServicesData } from "./types";
import { assertIsDiscoveryApiServicesData } from "./types/api/get-discovery-api-services";

interface Props {
    contractId?: string;
}

const getAvailableServices = async ({
    contractId,
    sdkConfig,
}: Props & InternalProps): Promise<DiscoveryApiServicesData> => {

    const response = await net.get(`${sdkConfig.baseUrl}discovery/services`, {
        headers: { contractId },
    }).json();

    assertIsDiscoveryApiServicesData(response);

    return response.data;
};

export {
    getAvailableServices,
};
