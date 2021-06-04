/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import * as t from "io-ts";
import { get } from "lodash";
import { getVerifiedJWTPayload } from "./authorisation";
import { getRandomAlphaNumeric } from "./crypto";
import { net } from "./net";
import { SDKConfigProps } from "./sdk";
import { Session } from "./types/api/session";
import { UserAccessToken, UserAccessTokenCodec } from "./types/user-access-token";
import { sign } from "jsonwebtoken";
import { URL, URLSearchParams } from "url";
import { refreshTokenWrapper } from "./utils/refreshTokenWrapper";

export interface GetOnboardServiceUrlProps {
    errorCallback: string;
    successCallback: string;
    userAccessToken: UserAccessToken;
    serviceId: number;
}

export const GetOnboardServiceUrlCodec: t.Type<GetOnboardServiceUrlProps> = t.type({
    errorCallback: t.string,
    successCallback: t.string,
    userAccessToken: UserAccessTokenCodec,
    serviceId: t.number,
});

export interface GetOnboardServiceUrlResponse {
    session: Session;
    userAccessToken: UserAccessToken;
    url: string;
}

const _getOnboardServiceUrl = async (
    {sdkConfig, ...props}: GetOnboardServiceUrlProps & SDKConfigProps,
): Promise<GetOnboardServiceUrlResponse> => {
    if (!GetOnboardServiceUrlCodec.is(props)) {
        throw new Error("Error on getOnboardServiceUrl(). Incorrect parameters passed in.")
    }

    const { applicationId, contractId, privateKey, redirectUri } = sdkConfig.authorizationConfig;
    const { userAccessToken } = props;

    const jwt: string = sign(
        {
            access_token: userAccessToken.accessToken.value,
            client_id: `${applicationId}_${contractId}`,
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

    const payload = await getVerifiedJWTPayload(get(response.body, "token"), sdkConfig);
    const code = payload.reference_code;
    const session = get(response.body, "session");

    const result: URL = new URL(`${sdkConfig.onboardUrl}onboard`);
    result.search = new URLSearchParams({
        code,
        successCallback: props.successCallback,
        errorCallback: props.errorCallback,
        serviceId: props.serviceId.toString(),
    }).toString();

    return {
        url: result.toString(),
        session,
        userAccessToken: props.userAccessToken,
    };
};

export const getOnboardServiceUrl = async (props: GetOnboardServiceUrlProps & SDKConfigProps)
: Promise<GetOnboardServiceUrlResponse> => {
    return refreshTokenWrapper(_getOnboardServiceUrl, props);
};
