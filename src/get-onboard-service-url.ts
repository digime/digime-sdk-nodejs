/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import * as t from "io-ts";
import { get } from "lodash";
import { getRandomAlphaNumeric } from "./crypto";
import { net } from "./net";
import { Session } from "./types/api/session";
import { UserAccessToken, UserAccessTokenCodec } from "./types/user-access-token";
import { sign } from "jsonwebtoken";
import { URL, URLSearchParams } from "url";
import { refreshTokenWrapper } from "./utils/refresh-token-wrapper";
import { getPayloadFromToken } from "./utils/get-payload-from-token";
import { SDKConfiguration } from "./types/sdk-configuration";
import { ContractDetails, ContractDetailsCodec } from "./types/common";

interface GetOnboardServiceUrlOptions {
    contractDetails: ContractDetails;
    errorCallback: string;
    successCallback: string;
    userAccessToken: UserAccessToken;
    serviceId: number;
}

const GetOnboardServiceUrlCodec: t.Type<GetOnboardServiceUrlOptions> = t.type({
    contractDetails: ContractDetailsCodec,
    errorCallback: t.string,
    successCallback: t.string,
    userAccessToken: UserAccessTokenCodec,
    serviceId: t.number,
});

interface GetOnboardServiceUrlResponse {
    session: Session;
    userAccessToken: UserAccessToken;
    url: string;
}

const _getOnboardServiceUrl = async (
    props: GetOnboardServiceUrlOptions,
    sdkConfig: SDKConfiguration,
): Promise<GetOnboardServiceUrlResponse> => {
    if (!GetOnboardServiceUrlCodec.is(props)) {
        throw new Error("Error on getOnboardServiceUrl(). Incorrect parameters passed in.")
    }

    const { userAccessToken, contractDetails } = props;
    const { contractId, privateKey, redirectUri } = contractDetails;

    const jwt: string = sign(
        {
            access_token: userAccessToken.accessToken.value,
            client_id: `${sdkConfig.applicationId}_${contractId}`,
            nonce: getRandomAlphaNumeric(32),
            redirect_uri: redirectUri,
            timestamp: new Date().getTime(),
        },
        privateKey.toString(),
        {
            algorithm: "PS512",
            noTimestamp: true,
        },
    );

    const response = await net.post(`${sdkConfig.baseUrl}oauth/token/reference`, {
        headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
        },
        responseType: "json",
    });

    const payload = await getPayloadFromToken(get(response.body, "token"), sdkConfig);
    const code = payload.reference_code;
    const session = get(response.body, "session");

    const result: URL = new URL(`${sdkConfig.onboardUrl}onboard`);
    result.search = new URLSearchParams({
        code,
        successCallback: props.successCallback,
        errorCallback: props.errorCallback,
        service: props.serviceId.toString(),
    }).toString();

    return {
        url: result.toString(),
        session,
        userAccessToken: props.userAccessToken,
    };
};

const getOnboardServiceUrl = async (props: GetOnboardServiceUrlOptions, sdkConfiguration: SDKConfiguration)
: Promise<GetOnboardServiceUrlResponse> => {
    return refreshTokenWrapper(_getOnboardServiceUrl, props, sdkConfiguration);
};

export {
    getOnboardServiceUrl,
    GetOnboardServiceUrlOptions,
    GetOnboardServiceUrlResponse,
}
