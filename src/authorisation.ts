/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import { decode, sign, verify } from "jsonwebtoken";
import { getRandomAlphaNumeric } from "./crypto";
import { AccessTokenExchangeError, JWTVerificationError, OAuthError, TypeValidationError } from "./errors";
import { ExchangeCodeForTokenOptions, RefreshTokenOptions } from "./types";
import { isPlainObject, isNonEmptyString } from "./utils";
import { net } from "./net";
import { DMESDKConfiguration, SDKConfigProps } from "./sdk";
import isString from "lodash.isstring";
import { isJWKS } from "./types/api/jwks";
import get from "lodash.get";
import { HTTPError } from "got/dist/source";
import { UserAccessToken } from "./types/user-access-token";

const exchangeCodeForToken = async ({
    authorizationCode,
    codeVerifier,
    sdkConfig,
}: ExchangeCodeForTokenOptions & SDKConfigProps): Promise<UserAccessToken> => {

    const { applicationId, contractId, privateKey, redirectUri } = sdkConfig.authorizationConfig;

    if (!isNonEmptyString(authorizationCode)) {
        throw new TypeValidationError("Authorization code cannot be empty");
    }

    if (typeof codeVerifier !== 'undefined' && !isNonEmptyString(codeVerifier)) {
        throw new TypeValidationError("Code verifier must be empty or a string");
    }

    const jwt: string = sign(
        {
            client_id: `${applicationId}_${contractId}`,
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

        const payload = await getVerifiedJWTPayload(get(response.body, "token"), sdkConfig);

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

const refreshToken = async ({
    userAccessToken,
    sdkConfig,
}: RefreshTokenOptions & SDKConfigProps): Promise<UserAccessToken> => {
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

        const payload = await getVerifiedJWTPayload(get(response.body, "token"), sdkConfig);
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

const getVerifiedJWTPayload = async (token: string, options: DMESDKConfiguration): Promise<any> => {
    const decodedToken = decode(token, {complete: true});

    if (!isPlainObject(decodedToken)) {
        throw new JWTVerificationError("Unexpected JWT payload in token");
    }

    const jku: unknown = decodedToken?.header?.jku;
    const kid: unknown = decodedToken?.header?.kid;

    if (!isString(jku) || !isString(kid)) {
        throw new JWTVerificationError("Unexpected JWT payload in token");
    }

    const jkuResponse = await net.get(jku, {
        responseType: "json",
        retry: options.retryOptions,
    });

    if (!isJWKS(jkuResponse.body)) {
        throw new JWTVerificationError("Server returned non-JWKS response");
    }

    const pem = jkuResponse.body.keys.filter((key) => key.kid === kid).map((key) => key.pem);

    try {
        // NOTE: Casting to any as pem is unknown and this will throw anyway
        return verify(token, pem[0] as any, {algorithms: ["PS512"]});
    } catch (error) {
        throw new JWTVerificationError(get(error, "body.error.message"));
    }
};

export {
    exchangeCodeForToken,
    getVerifiedJWTPayload,
    refreshToken,
};
