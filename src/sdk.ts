/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import { write, WriteOptions } from "./write";
import { BasicSDKConfiguration, SDKConfiguration, SDKConfigurationCodec } from "./types/dme-sdk-configuration";
import { getAvailableServices } from "./get-available-services";
import { getAuthorizeUrl, GetAuthorizeUrlOptions } from "./get-authorize-url";
import { getOnboardServiceUrl, GetOnboardServiceUrlOptions } from "./onboard-service";
import { addTrailingSlash } from "./utils";
import { exchangeCodeForToken, ExchangeCodeForTokenOptions } from "./exchange-code-for-token";
import { readSession, ReadSessionOptions } from "./read-session";
import { readFile, ReadFileOptions } from "./read-file";
import { readFileList, ReadFileListOptions } from "./read-file-list";
import { readAllFiles, ReadAllFilesOptions } from "./read-all-files";
import { readAccounts, ReadAccountsOptions } from "./read-accounts";

const init = (config?: Partial<SDKConfiguration>) => {
    const formatted = {
        ...config,
        baseUrl: addTrailingSlash(config?.baseUrl),
        onboardUrl: addTrailingSlash(config?.onboardUrl),
    }

    const sdkConfig: BasicSDKConfiguration = {
        baseUrl: "https://api.digi.me/v1.6/",
        onboardUrl: "https://api.digi.me/saas/",
        retryOptions: {
            retries: 5,
        },
        ...formatted,
    };

    let sdk: any = {}

    if (SDKConfigurationCodec.is(sdkConfig)) {
        sdk = {
            authorize: (props: GetAuthorizeUrlOptions) => (
                getAuthorizeUrl(props, sdkConfig)
            ),
            onboardService: (props: GetOnboardServiceUrlOptions ) => (
                getOnboardServiceUrl(props, sdkConfig)
            ),
            exchangeCodeForToken: (props: ExchangeCodeForTokenOptions) => (
                exchangeCodeForToken(props, sdkConfig)
            ),
            write: (props: WriteOptions) => (
                write(props, sdkConfig)
            ),
            readSession: (props: ReadSessionOptions) => (
                readSession(props, sdkConfig)
            ),
        }
    }

    sdk = {
        ...sdk,
        getAvailableServices: (contractId?: string) => (
            getAvailableServices(sdkConfig, contractId)
        ),
        readFile: (props: ReadFileOptions) => (
            readFile(props, sdkConfig)
        ),
        readFileList: (props: ReadFileListOptions) => (
            readFileList(props, sdkConfig)
        ),
        readAllFiles: (props: ReadAllFilesOptions) => (
            readAllFiles(props, sdkConfig)
        ),
        readAccounts: (props: ReadAccountsOptions) => (
            readAccounts(props, sdkConfig)
        ),
    }

    return sdk;
};

export {
    init,
};
