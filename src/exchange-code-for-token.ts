/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import { sign } from "jsonwebtoken";
import { getRandomAlphaNumeric } from "./crypto";
import { AccessTokenExchangeError, TypeValidationError } from "./errors";
import { isNonEmptyString } from "./utils/basic-utils";
import { net } from "./net";
import get from "lodash.get";
import { UserAccessToken } from "./types/user-access-token";
import { getPayloadFromToken } from "./utils/get-payload-from-token";
import { SDKConfiguration } from "./types/sdk-configuration";
import { ContractDetails } from "./types/common";

interface ExchangeCodeForTokenOptions {
    contractDetails: ContractDetails;
    codeVerifier?: string;
    authorizationCode: string,
}

const exchangeCodeForToken = async (
    options: ExchangeCodeForTokenOptions,
    sdkConfig: SDKConfiguration,
): Promise<UserAccessToken> => {

    const { authorizationCode, codeVerifier, contractDetails } = options;
    const { contractId, privateKey, redirectUri } = contractDetails;

    if (!isNonEmptyString(authorizationCode)) {
        throw new TypeValidationError("Authorization code cannot be empty");
    }

    if (!isNonEmptyString(codeVerifier)) {
        throw new TypeValidationError("Code verifier must be empty or a string");
    }

    const jwt: string = sign(
        {
            client_id: `${sdkConfig.applicationId}_${contractId}`,
            code: authorizationCode,
            code_verifier: codeVerifier,
            grant_type: "authorization_code",
            nonce: getRandomAlphaNumeric(32),
            redirect_uri: redirectUri,
            timestamp: new Date().getTime(),
        },
        privateKey,
        {
            algorithm: "PS512",
            noTimestamp: true,
        },
    );

    try {
        const response = await net.post(`${sdkConfig.baseUrl}oauth/token`, {
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
            responseType: "json",
            retry: sdkConfig.retryOptions,
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
        throw new AccessTokenExchangeError("Failed to exchange authorization code to access token.");
    }
};

export {
    exchangeCodeForToken,
    ExchangeCodeForTokenOptions,
};
