/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import { URL } from "url";
import { TypeValidationError } from "./errors";
import { net, handleInvalidatedSdkResponse } from "./net";
import { getCreatePostboxWithAccessTokenUrl, getCreatePostboxUrl, getPostboxImportUrl, pushDataToPostbox } from "./postbox";
import sdkVersion from "./sdk-version";
import type {
    CAScope,
    ConsentOnceOptions,
    ConsentOngoingAccessOptions,
    PrepareFilesUsingAccessTokenOptions,
    EstablishSessionOptions,
    ExchangeCodeForTokenOptions,
    FileMeta,
    GuestConsentProps,
    PushDataToPostboxOptions,
    UserDataAccessOptions,
    GetFileOptions,
    GetFileListOptions,
    GetSessionDataOptions,
    GetReceiptOptions,
    ExchangeAccessTokenForReferenceOptions,
    SaasOptions,
} from "./types";
import { isPlainObject, isNonEmptyString } from "./utils";
import { assertIsSession, Session } from "./types/api/session";
import { DMESDKConfiguration, assertIsDMESDKConfiguration } from "./types/dme-sdk-configuration";
import { exchangeCodeForToken } from "./authorisation";
import { prepareFilesUsingAccessToken, getConsentUrl, getConsentWithAccessTokenUrl, getFileList, getSessionAccounts, getSessionData, getSaasUrl, getFile, exchangeAccessTokenForReference } from "./private-share";

const _establishSession = async ({
    applicationId,
    contractId,
    scope,
    sdkOptions,
}: EstablishSessionOptions & InternalProps): Promise<Session> => {
    if (!isNonEmptyString(applicationId)) {
        throw new TypeValidationError("Parameter appId should be a non empty string");
    }
    if (!isNonEmptyString(contractId)) {
        throw new TypeValidationError("Parameter contractId should be a non empty string");
    }
    const url = `${sdkOptions.baseUrl}/permission-access/session`;

    const sdkAgent = {
        name: "js",
        version: sdkVersion,
        meta: {
            node: process.version,
        },
    };
    try {

        const { body, headers } = await net.post(url, {
            json: {
                appId: applicationId,
                contractId,
                scope,
                sdkAgent,
                accept: {
                    compression: "gzip",
                },
            },
            responseType: "json",
            retry: sdkOptions.retryOptions,
        });

        if (headers["x-digi-sdk-status"]) {
            // tslint:disable-next-line:no-console max-line-length
            console.warn(`[digime-js-sdk@${sdkVersion}][${headers["x-digi-sdk-status"]}] ${headers["x-digi-sdk-status-message"]}`);
        }

        assertIsSession(body);

        return body;

    } catch (error) {

        handleInvalidatedSdkResponse(error);
        throw error;
    }
};

const _getGuestUrl = ({
    session,
    callbackUrl,
    sdkOptions,
}: GuestConsentProps & InternalProps) => {

    assertIsSession(session);

    if (!isNonEmptyString(callbackUrl)) {
        throw new TypeValidationError("Parameter callbackUrl should be a non empty string");
    }
    // tslint:disable-next-line:max-line-length
    return `${new URL(sdkOptions.baseUrl).origin}/apps/quark/v1/direct-onboarding?&callbackUrl=${encodeURIComponent(callbackUrl)}`;
};

const _getReceiptUrl = ({contractId, applicationId}: GetReceiptOptions) => {
    if (!isNonEmptyString(contractId)) {
        throw new TypeValidationError("Parameter contractId should be a non empty string");
    }
    if (!isNonEmptyString(applicationId)) {
        throw new TypeValidationError("Parameter appId should be a non empty string");
    }
    return `digime://receipt?contractId=${contractId}&appId=${applicationId}`;
};

interface InternalProps {
    sdkOptions: DMESDKConfiguration
}

const init = (options?: Partial<DMESDKConfiguration>) => {

    if (options !== undefined && !isPlainObject(options)) {
        throw new TypeValidationError("SDK options should be object that contains host and version properties");
    }

    const sdkOptions: DMESDKConfiguration = {
        baseUrl: "https://api.digi.me/v1.5",
        retryOptions: {
            retries: 5,
        },
        ...options,
    };

    assertIsDMESDKConfiguration(sdkOptions);

    return {
        establishSession: (props: EstablishSessionOptions) => (
            _establishSession({...props, sdkOptions})
        ),
        getReceiptUrl: (props: GetReceiptOptions) => (
            _getReceiptUrl(props)
        ),
        exchangeAccessTokenForReference: (props: ExchangeAccessTokenForReferenceOptions) => (
            exchangeAccessTokenForReference({...props, sdkOptions})
        ),
        authorize: {
            ongoing: {
                getCreatePostboxUrl: (props: ConsentOngoingAccessOptions) => (
                    getCreatePostboxWithAccessTokenUrl({...props, sdkOptions})
                ),
                getPrivateShareConsentUrl: (props: ConsentOngoingAccessOptions) => (
                    getConsentWithAccessTokenUrl({...props, sdkOptions})
                ),
                getSaasUrl: (props: SaasOptions) => (
                    getSaasUrl({...props, sdkOptions})
                ),
            },
            once: {
                getCreatePostboxUrl: (props: ConsentOnceOptions) => (
                    getCreatePostboxUrl(props)
                ),
                getPrivateShareConsentUrl: (props: ConsentOnceOptions) => (
                    getConsentUrl(props)
                ),
                getPrivateShareAsGuestUrl: (props: GuestConsentProps) => (
                    _getGuestUrl({...props, sdkOptions})
                ),
            },
            exchangeCodeForToken: (props: ExchangeCodeForTokenOptions) => (
                exchangeCodeForToken({...props, sdkOptions})
            ),
        },
        push: {
            pushDataToPostbox: (props: PushDataToPostboxOptions) => (
                pushDataToPostbox({...props, sdkOptions})
            ),
            getPostboxImportUrl: () => (
                getPostboxImportUrl()
            ),
        },
        pull: {
            prepareFilesUsingAccessToken : (props: PrepareFilesUsingAccessTokenOptions) => (
                prepareFilesUsingAccessToken({...props, sdkOptions})
            ),
            getFile: (props: GetFileOptions) => (
                getFile({...props, sdkOptions})
            ),
            getFileList: (props: GetFileListOptions) => (
                getFileList({...props, sdkOptions})
            ),
            getSessionData: (props: GetSessionDataOptions) => (
                getSessionData({...props, sdkOptions})
            ),
            getSessionAccounts: (props: UserDataAccessOptions) => (
                getSessionAccounts({...props, sdkOptions})
            ),
        },
    };
};

export {
    init,
    CAScope,
    FileMeta,
    Session,
    DMESDKConfiguration,
    InternalProps,
};
