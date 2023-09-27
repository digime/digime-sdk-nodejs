/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { DiscoveryAPIServicesData, DiscoveryAPIServicesResponse } from "./validators/discovery-api-services";

interface DigiMeSDKConfig {
    baseURL: string;
    onboardURL: string;
}

export class DigiMeSDK {
    private config: DigiMeSDKConfig = {
        baseURL: "https://api.digi.me/v1.7/",
        onboardURL: "https://api.digi.me/apps/saas/",
    };

    constructor(config: Partial<DigiMeSDKConfig> = {}) {
        // TODO: Enforce trailing slash on setting baseURL
        this.config = { ...this.config, ...config };
    }

    /**
     * Retrieve available services from the Digi.me Discovery API
     *
     * By default, it will return ALL the onboardable services
     *
     * However, if you pass in the `contractId` parameter, Digi.me Discovery API will instead
     * return only the services that can be onboarded with the provided contract
     */
    public async getAvailableServices({ contractId }: { contractId?: string } = {}): Promise<DiscoveryAPIServicesData> {
        const url = new URL(`${this.config.baseURL}discovery/services`);

        const headers: HeadersInit = {
            Accept: "application/json",
        };

        if (contractId) {
            headers.contractId = contractId;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
            // TODO: Our own errors
            throw new Error("DigiMeSDK - Discovery API returned a non-ok response");
        }

        return DiscoveryAPIServicesResponse.parse(await response.json()).data;
    }

    getAuthorizeUrl() {}

    getOnboardServiceUrl() {}

    getReauthorizeAccountUrl() {}

    exchangeCodeForToken() {}

    pushData() {}

    readSession() {}

    deleteUser() {}

    readFile() {}

    readFileList() {}

    readAllFiles() {}

    readAccounts() {}
}

const x = new DigiMeSDK({});
