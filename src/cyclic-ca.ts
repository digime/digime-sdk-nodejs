/*!
 * Copyright (c) 2009-2020 digi.me Limited. All rights reserved.
 */

import base64url from "base64url";
import { HTTPError } from "got";
import { decode, sign, verify } from "jsonwebtoken";
import get from "lodash.get";
import { URLSearchParams } from "url";
import { getRandomAlphaNumeric, hashSha256 } from "./crypto";
import { JWTVerificationError, OAuthError, TypeValidationError } from "./errors";
import { net, handleInvalidatedSdkResponse } from "./net";
import { getClientPrivateShareDeepLink } from "./paths";
import { DMESDKConfiguration, Session } from "./sdk";
import { OngoingAccessAuthorization, OngoingAccessConfiguration, UserAccessToken } from "./types";
import { isValidString, isPlainObject } from "./utils";
import isString from "lodash.isstring";
import { isJWKS } from "./types/api/jwks";

interface AuthorizeOngoingAccessResponse {
    dataAuthorized: boolean;
    updatedAccessToken?: UserAccessToken;
    authorizationUrl?: string;
    codeVerifier?: string;
}

const authorizeOngoingAccess = async (
    details: OngoingAccessAuthorization,
    session: Session,
    options: DMESDKConfiguration,
): Promise<AuthorizeOngoingAccessResponse> => {

    if (details !== undefined && !isPlainObject(details)) {
        // tslint:disable-next-line:max-line-length
        throw new TypeValidationError("Details should be a plain object that contains the properties applicationId, contractId, privateKey and redirectUri");
    }

    const {accessToken, applicationId, contractId, privateKey, redirectUri} = details;

    if (!isValidString(applicationId) || !isValidString(contractId) ||
        !isValidString(redirectUri) || !privateKey
    ) {
        // tslint:disable-next-line:max-line-length
        throw new TypeValidationError("Details should be a plain object that contains the properties applicationId, contractId, privateKey and redirectUri");
    }

    if (accessToken) {

        // 1. We have an access token, try and trigger a data request
        try {
            const updatedAccessToken: UserAccessToken = await triggerDataQuery(
                details, accessToken, session.sessionKey, options,
            );

            return {
                dataAuthorized: true,
                updatedAccessToken,
            };
        } catch (error) { /* Data retrieval failed. Continue. */ }

        // 2. Wasn't successful, try refreshing the token
        try {
            const newTokens: UserAccessToken = await refreshToken(details, accessToken, options);
            const updatedAccessToken: UserAccessToken = await triggerDataQuery(
                details, newTokens, session.sessionKey, options,
            );

            return {
                dataAuthorized: true,
                updatedAccessToken,
            };
        } catch (error) { /* Refresh token invalid. Continue. */ }
    }

    // No access token or refresh unsuccessful.
    // We will return to the user with link to trigger digi.me client for consent
    const {preauthorizationCode, codeVerifier} = await preauthorize(details, details.state, options);

    return {
        dataAuthorized: false,
        authorizationUrl: getClientPrivateShareDeepLink(
            details.applicationId,
            session,
            new URLSearchParams({
                preauthorizationCode,
                callbackUrl: redirectUri,
            }),
        ),
        codeVerifier,
    };
};

interface PreauthorizeResponse {
    codeVerifier: string;
    preauthorizationCode: string;
}

const preauthorize = async (
    config: OngoingAccessConfiguration,
    state: string = "",
    options: DMESDKConfiguration,
): Promise<PreauthorizeResponse> => {
    const codeVerifier: string = base64url(getRandomAlphaNumeric(32));
    const jwt: string = sign(
        {
            client_id: `${config.applicationId}_${config.contractId}`,
            code_challenge: base64url(hashSha256(codeVerifier)),
            code_challenge_method: "S256",
            nonce: getRandomAlphaNumeric(32),
            redirect_uri: config.redirectUri,
            response_mode: "query",
            response_type: "code",
            state,
            timestamp: new Date().getTime(),
        },
        config.privateKey.toString(),
        {
            algorithm: "PS512",
            noTimestamp: true,
        },
    );

    try {
        const response = await net.post(`${options.baseUrl}/oauth/authorize`, {
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
            responseType: "json",
            retry: options.retryOptions,
        });

        const payload = await getVerifiedJWTPayload(get(response.body, "token"), options);
        return {
            codeVerifier,
            preauthorizationCode: `${payload.preauthorization_code}`,
        };
    } catch (error) {

        handleInvalidatedSdkResponse(error);

        throw error;
    }
};

const exchangeCodeForToken = async (
    config: OngoingAccessConfiguration,
    codeVerifier: string,
    authorizationCode: string,
    options: DMESDKConfiguration,
): Promise<UserAccessToken> => {

    if (config !== undefined && !isPlainObject(config)) {
        // tslint:disable-next-line:max-line-length
        throw new TypeValidationError("Details should be a plain object that contains the properties applicationId, contractId, privateKey and redirectUri");
    }

    const {applicationId, contractId, privateKey, redirectUri} = config;

    if (!isValidString(applicationId) || !isValidString(contractId) ||
        !isValidString(redirectUri) || !privateKey
    ) {
        // tslint:disable-next-line:max-line-length
        throw new TypeValidationError("Details should be a plain object that contains the properties applicationId, contractId, privateKey and redirectUri");
    }

    if (!isValidString(codeVerifier) || !isValidString(authorizationCode)) {
        // tslint:disable-next-line:max-line-length
        throw new TypeValidationError("Code verifier and authorization code cannot be empty");
    }

    const jwt: string = sign(
        {
            client_id: `${config.applicationId}_${config.contractId}`,
            code: authorizationCode,
            code_verifier: codeVerifier,
            grant_type: "authorization_code",
            nonce: getRandomAlphaNumeric(32),
            redirect_uri: config.redirectUri,
            timestamp: new Date().getTime(),
        },
        config.privateKey.toString(),
        {
            algorithm: "PS512",
            noTimestamp: true,
        },
    );

    try {
        const response = await net.post(`${options.baseUrl}/oauth/token`, {
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
            responseType: "json",
            retry: options.retryOptions,
        });

        const payload = await getVerifiedJWTPayload(get(response.body, "token"), options);

        return {
            accessToken: `${payload.access_token}`,
            refreshToken: `${payload.refresh_token}`,
            expiry: payload.expires_on,
        };
    } catch (error) {
        throw error;
    }
};

const triggerDataQuery = async (
    config: OngoingAccessConfiguration,
    token: UserAccessToken,
    sessionKey: string,
    options: DMESDKConfiguration,
): Promise<UserAccessToken> => {
    const jwt: string = sign(
        {
            access_token: token.accessToken,
            client_id: `${config.applicationId}_${config.contractId}`,
            nonce: getRandomAlphaNumeric(32),
            redirect_uri: config.redirectUri,
            session_key: sessionKey,
            timestamp: new Date().getTime(),
        },
        config.privateKey.toString(),
        {
            algorithm: "PS512",
            noTimestamp: true,
        },
    );

    const url = `${options.baseUrl}/permission-access/trigger`;

    await net.post(url, {
        headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json", // NOTE: we might not need this
        },
        responseType: "json",
    });

    return token;
};

const refreshToken = async (
    config: OngoingAccessConfiguration,
    token: UserAccessToken,
    options: DMESDKConfiguration,
): Promise<UserAccessToken> => {
    const jwt: string = sign(
        {
            client_id: `${config.applicationId}_${config.contractId}`,
            grant_type: "refresh_token",
            nonce: getRandomAlphaNumeric(32),
            redirect_uri: config.redirectUri,
            refresh_token: token.refreshToken,
            timestamp: new Date().getTime(),
        },
        config.privateKey.toString(),
        {
            algorithm: "PS512",
            noTimestamp: true,
        },
    );

    const url = `${options.baseUrl}/oauth/token`;

    try {
        const response = await net.post(url, {
            headers: {
                Authorization: `Bearer ${jwt}`,
                "Content-Type": "application/json", // NOTE: we might not need this
            },
            responseType: "json",
        });

        const payload = await getVerifiedJWTPayload(get(response.body, "token"), options);
        return {
            accessToken: `${payload.access_token}`,
            refreshToken: `${payload.refresh_token}`,
            expiry: payload.expires_on,
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
    AuthorizeOngoingAccessResponse,
    authorizeOngoingAccess,
    exchangeCodeForToken,
};
