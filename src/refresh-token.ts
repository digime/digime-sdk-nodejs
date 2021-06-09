/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import { sign } from "jsonwebtoken";
import { getRandomAlphaNumeric } from "./crypto";
import { OAuthError } from "./errors";
import { net } from "./net";
import get from "lodash.get";
import { HTTPError } from "got/dist/source";
import { UserAccessToken } from "./types/user-access-token";
import { getPayloadFromToken } from "./utils/get-payload-from-token";
import { SDKConfiguration } from "./types/dme-sdk-configuration";

interface RefreshTokenOptions {
    userAccessToken: UserAccessToken;
}

const refreshToken = async (
    options: RefreshTokenOptions,
    sdkConfig: SDKConfiguration
): Promise<UserAccessToken> => {

    const { userAccessToken } = options;
    const { applicationId, contractId, privateKey, redirectUri } = sdkConfig.authorizationConfig;
    const jwt: string = sign(
        {
            client_id: `${applicationId}_${contractId}`,
            grant_type: "refresh_token",
            nonce: getRandomAlphaNumeric(32),
            redirect_uri: redirectUri,
            refresh_token: userAccessToken.refreshToken,
            timestamp: new Date().getTime(),
        },
        privateKey.toString(),
        {
            algorithm: "PS512",
            noTimestamp: true,
        },
    );

    const url = `${sdkConfig.baseUrl}oauth/token`;

    try {
        const response = await net.post(url, {
            headers: {
                Authorization: `Bearer ${jwt}`,
                "Content-Type": "application/json", // NOTE: we might not need this
            },
            responseType: "json",
        });

        const payload = await getPayloadFromToken(get(response.body, "token"), sdkConfig);
        return {
            accessToken: {
                value: payload.access_token.value,
                expiry: payload.access_token.expires_on,
            },
            refreshToken: {
                value: payload.refresh_token .value,
                expiry: payload.refresh_token .expires_on,
            },
        };

    } catch (error) {
        if (!(error instanceof HTTPError)) {
            throw error;
        }

        const errorCode = get(error, "body.error.code");

        if (
            errorCode === "InvalidJWT" || errorCode === "InvalidRequest" || errorCode === "InvalidRedirectUri" ||
            errorCode === "InvalidGrant" || errorCode === "InvalidToken" || errorCode === "InvalidTokenType"
        ) {
            throw new OAuthError(get(error, "body.error.message"));
        }

        throw error;
    }
};

export {
    RefreshTokenOptions,
    refreshToken,
};
