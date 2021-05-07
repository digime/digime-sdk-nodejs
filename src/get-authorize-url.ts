/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import { URL, URLSearchParams } from "url";
import { getPayloadFromToken } from "./utils/get-payload-from-token";
import { TypeValidationError } from "./errors";
import { Session } from "./types/api/session";
import { UserAccessToken, UserAccessTokenCodec } from "./types/user-access-token";
import * as t from "io-ts";
import base64url from "base64url";
import { getRandomAlphaNumeric, hashSha256 } from "./crypto";
import { sign } from "jsonwebtoken";
import { handleInvalidatedSdkResponse, net } from "./net";
import { get } from "lodash";
import { SDKConfiguration } from "./types/sdk-configuration";
import { CAScope, ContractDetails, ContractDetailsCodec } from "./types/common";

interface GetAuthorizeUrlOptions {

    /**
     * Any contract related details here.
     */
    contractDetails: ContractDetails;

    /**
     * A URL to call if an error occurs. The redirect URL in contractDetails will be called if the authorization was successful.
     */
    callback: string;

    /**
     * Onboard a service while authorizing.
     */
    serviceId?: number;

    /**
     * To renew an existing access token.
     */
    userAccessToken?: UserAccessToken;

    /**
     * For read contracts, you can limit to scope of data to query.
     */
    scope?: CAScope;

    /**
     * Any extra data you want to be passed back after a authorization flow.
     */
    state?: string
}

export const GetAuthorizeUrlOptionsCodec: t.Type<GetAuthorizeUrlOptions> = t.intersection([
    t.type({
        contractDetails: ContractDetailsCodec,
        callback: t.string,
    }),
    t.partial({
        serviceId: t.number,
        userAccessToken: UserAccessTokenCodec,
        state: t.string,
    }),
]);

interface GetAuthorizeUrlResponse {
    url: string;
    codeVerifier: string;
    session: Session;
}

const getAuthorizeUrl = async (
    props: GetAuthorizeUrlOptions,
    sdkConfig: SDKConfiguration,
): Promise<GetAuthorizeUrlResponse> => {

    if (!GetAuthorizeUrlOptionsCodec.is(props)) {
        // tslint:disable-next-line:max-line-length
        throw new TypeValidationError("Details should be a plain object that contains the properties applicationId, contractId, privateKey and redirectUri");
    }

    const { code, codeVerifier, session } = await _authorize(props, sdkConfig);

    const result: URL = new URL(`${sdkConfig.onboardUrl}authorize`);
    result.search = new URLSearchParams({
        code,
        callback: props.callback,
        service: props.serviceId?.toString(),
    }).toString();

    return {
        url: result.toString(),
        codeVerifier,
        session,
    };
};

interface AuthorizeResponse {
    codeVerifier: string;
    code: string;
    session: Session;
}

const _authorize = async (
    {contractDetails, state, userAccessToken}: GetAuthorizeUrlOptions,
    sdkConfig: SDKConfiguration,
): Promise<AuthorizeResponse> => {
    const { contractId, privateKey, redirectUri } = contractDetails;

    const codeVerifier: string = base64url(getRandomAlphaNumeric(32));
    const jwt: string = sign(
        {
            access_token: userAccessToken?.accessToken.value,
            client_id: `${sdkConfig.applicationId}_${contractId}`,
            code_challenge: base64url(hashSha256(codeVerifier)),
            code_challenge_method: "S256",
            nonce: getRandomAlphaNumeric(32),
            redirect_uri: redirectUri,
            response_mode: "query",
            response_type: "code",
            state,
            timestamp: new Date().getTime(),
        },
        privateKey.toString(),
        {
            algorithm: "PS512",
            noTimestamp: true,
        },
    );

    try {
        const {body} = await net.post(`${sdkConfig.baseUrl}oauth/authorize`, {
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
            responseType: "json",
            retry: sdkConfig.retryOptions,
        });

        const payload = await getPayloadFromToken(get(body, "token"), sdkConfig);
        return {
            codeVerifier,
            code: `${payload.preauthorization_code}`,
            session: get(body, "session"),
        };
    } catch (error) {
        handleInvalidatedSdkResponse(error);
        throw error;
    }
};

export {
    getAuthorizeUrl,
    GetAuthorizeUrlOptions,
    GetAuthorizeUrlResponse,
};
