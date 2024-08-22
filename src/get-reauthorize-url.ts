/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import * as t from "io-ts";
import get from "lodash.get";
import { handleServerResponse, net } from "./net";
import { Session } from "./types/api/session";
import { UserAccessToken, UserAccessTokenCodec } from "./types/user-access-token";
import { sign } from "jsonwebtoken";
import { URL, URLSearchParams } from "url";
import { getPayloadFromToken } from "./utils/get-payload-from-token";
import { SDKConfiguration } from "./types/sdk-configuration";
import { ContractDetails, ContractDetailsCodec, PullSessionOptions, PullSessionOptionsCodec } from "./types/common";
import { TypeValidationError } from "./errors";
import { isNonEmptyString } from "./utils/basic-utils";
import sdkVersion from "./sdk-version";
import base64url from "base64url";
import { getRandomAlphaNumeric, hashSha256 } from "./crypto";

export interface GetReauthorizeUrlOptions {
    /**
     * Any contract related details here.
     */
    contractDetails: ContractDetails;
    /**
     * A URL to call to be called after authorization is done.
     */
    callback: string;
    /**
     * User access token you may already have for this user from this or from another contract.
     */
    userAccessToken: UserAccessToken;
    /**
     * Any extra data you want to be passed back after a authorization flow.
     */
    state?: string;
    /**
     * Send prefared locale for authorization client to be used.
     * If passed locale is not supported then language will fallback to browser language.
     * If browser locale is not supported we will fallback to default locale (en).
     */
    locale?: string;
    /**
     * Any optional parameters for the share.
     */
    sessionOptions?: {
        pull?: PullSessionOptions;
    };

    /**
     * Flag to indicate if data query will be triggered post service authorisation. Default is true.
     * If this is set to false data for added service will not be returned.
     * You may want to set to false when adding multiple services subsequently and only get data for all services when adding last service.
     */
    triggerQuery?: boolean;
}

const GetReauthorizeUrlCodec: t.Type<GetReauthorizeUrlOptions> = t.intersection([
    t.type({
        contractDetails: ContractDetailsCodec,
        callback: t.string,
        userAccessToken: UserAccessTokenCodec,
    }),
    t.partial({
        state: t.string,
        locale: t.string,
        sessionOptions: t.partial({
            pull: PullSessionOptionsCodec,
        }),
        triggerQuery: t.boolean,
    }),
]);

export interface GetReauthorizeUrlResponse {
    codeVerifier: string;
    session: Session;
    url: string;
}

const getReauthorizeUrl = async (
    props: GetReauthorizeUrlOptions,
    sdkConfig: SDKConfiguration
): Promise<GetReauthorizeUrlResponse> => {
    if (!GetReauthorizeUrlCodec.is(props) || !isNonEmptyString(props.callback)) {
        throw new TypeValidationError("Error on getReauthorizeUrl(). Incorrect parameters passed in.");
    }

    const { userAccessToken, contractDetails, callback, locale, state, sessionOptions, triggerQuery } = props;
    const { contractId, privateKey } = contractDetails;
    let codeVerifier: string = "";
    try {
        const response = await net.post(`${sdkConfig.baseUrl}oauth/token/reference`, {
            headers: {
                "Content-Type": "application/json",
            },
            json: {
                agent: {
                    sdk: {
                        name: "nodejs",
                        version: sdkVersion,
                        meta: {
                            node: process.version,
                        },
                    },
                },
                actions: sessionOptions,
            },
            responseType: "json",
            hooks: {
                beforeRequest: [
                    (options) => {
                        codeVerifier = base64url(getRandomAlphaNumeric(32));
                        const jwt: string = sign(
                            {
                                access_token: userAccessToken.accessToken.value,
                                client_id: `${sdkConfig.applicationId}_${contractId}`,
                                code_challenge: base64url(hashSha256(codeVerifier)),
                                code_challenge_method: "S256",
                                nonce: getRandomAlphaNumeric(32),
                                redirect_uri: callback,
                                state,
                                timestamp: Date.now(),
                            },
                            privateKey.toString(),
                            {
                                algorithm: "PS512",
                                noTimestamp: true,
                            }
                        );
                        options.headers["Authorization"] = `Bearer ${jwt}`;
                    },
                ],
            },
        });

        const payload = await getPayloadFromToken(get(response.body, "token"), sdkConfig);
        const code = get(payload, ["reference_code"]);
        const session = get(response.body, "session", {} as GetReauthorizeUrlResponse["session"]);

        const result: URL = new URL(`${sdkConfig.onboardUrl}user-reauth`);

        result.search = new URLSearchParams({
            code,
            ...(locale && { lng: locale }),
            ...(triggerQuery !== undefined && {
                triggerQuery: triggerQuery.toString(),
            }),
        }).toString();

        return {
            codeVerifier,
            url: result.toString(),
            session,
        };
    } catch (error) {
        handleServerResponse(error);
        throw error;
    }
};

export { getReauthorizeUrl };
