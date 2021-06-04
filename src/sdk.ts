/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import { pushDataToPostbox } from "./write";
import type {
    CAScope,
    PrepareFilesUsingAccessTokenOptions,
    ExchangeCodeForTokenOptions,
    FileMeta,
    PushDataToPostboxOptions,
    UserDataAccessOptions,
    GetFileOptions,
    GetFileListOptions,
    GetSessionDataOptions,
} from "./types";
import { Session } from "./types/api/session";
import { BasicSDKConfiguration, DMESDKConfiguration, DMESDKConfigurationCodec } from "./types/dme-sdk-configuration";
import { exchangeCodeForToken } from "./authorisation";
import { prepareFilesUsingAccessToken, readFileList, readSessionAccounts, readSessionData, readFile } from "./private-share";
import { getAvailableServices } from "./getAvailableServices";
import { getAuthorizeUrl, GetAuthorizeUrlProps } from "./getAuthorizeUrl";
import { getOnboardServiceUrl, GetOnboardServiceUrlProps } from "./onboardService";
import { addTrailingSlash } from "./utils";

interface InternalProps {
    sdkConfig: BasicSDKConfiguration
}

interface SDKConfigProps {
    sdkConfig: DMESDKConfiguration
}

const init = (config?: Partial<DMESDKConfiguration>) => {
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

    if (DMESDKConfigurationCodec.is(sdkConfig)) {
        sdk = {
            authorize: (props: GetAuthorizeUrlProps) => (
                getAuthorizeUrl({...props, sdkConfig})
            ),
            onboardService: (props: GetOnboardServiceUrlProps ) => (
                getOnboardServiceUrl({...props, sdkConfig})
            ),
            exchangeCodeForToken: (props: ExchangeCodeForTokenOptions) => (
                exchangeCodeForToken({...props, sdkConfig})
            ),
            write: (props: PushDataToPostboxOptions) => (
                pushDataToPostbox({...props, sdkConfig})
            ),
            readSession: (props: PrepareFilesUsingAccessTokenOptions) => (
                prepareFilesUsingAccessToken({...props, sdkConfig})
            ),
        }
    }

    sdk = {
        ...sdk,
        getAvailableServices: (contractId?: string) => (
            getAvailableServices({sdkConfig, contractId})
        ),
        readFile: (props: GetFileOptions) => (
            readFile({...props, sdkConfig})
        ),
        readFileList: (props: GetFileListOptions) => (
            readFileList({...props, sdkConfig})
        ),
        readSessionData: (props: GetSessionDataOptions) => (
            readSessionData({...props, sdkConfig})
        ),
        readSessionAccounts: (props: UserDataAccessOptions) => (
            readSessionAccounts({...props, sdkConfig})
        ),
    }

    return sdk;
};

export {
    init,
    CAScope,
    FileMeta,
    Session,
    DMESDKConfiguration,
    InternalProps,
    SDKConfigProps
};
