/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import { pushDataToPostbox } from "./postbox";
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
import { DMESDKConfiguration, assertIsDMESDKConfiguration } from "./types/dme-sdk-configuration";
import { exchangeCodeForToken } from "./authorisation";
import { prepareFilesUsingAccessToken, readFileList, readSessionAccounts, readSessionData, readFile } from "./private-share";
import { getAvailableServices } from "./getAvailableServices";
import { getAuthorizeUrl, GetAuthorizeUrlProps } from "./authorize";
import { getOnboardServiceUrl, GetOnboardServiceUrlProps } from "./onboardService";

interface InternalProps {
    sdkConfig: DMESDKConfiguration
}

const init = (config: DMESDKConfiguration) => {

    assertIsDMESDKConfiguration(config);

    const sdkConfig: DMESDKConfiguration = {
        baseUrl: "https://api.digi.me/v1.6",
        onboardUrl: "https://api.digi.me/v1.6",
        retryOptions: {
            retries: 5,
        },
        ...config,
    };

    return {
        getAvailableServices: (contractId?: string) => (
            getAvailableServices({sdkConfig, contractId})
        ),
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
        )
    }
};

export {
    init,
    CAScope,
    FileMeta,
    Session,
    DMESDKConfiguration,
    InternalProps,
};
