/*!
 * © World Data Exchange. All rights reserved.
 */

import * as t from "io-ts";
import get from "lodash.get";
import { getRandomAlphaNumeric } from "./crypto";
import { handleServerResponse, net } from "./net";
import { Session } from "./types/api/session";
import { UserAccessToken, UserAccessTokenCodec } from "./types/user-access-token";
import { sign } from "jsonwebtoken";
import { URL, URLSearchParams } from "node:url";
import { refreshTokenWrapper } from "./utils/refresh-token-wrapper";
import { getPayloadFromToken } from "./utils/get-payload-from-token";
import { SDKConfiguration } from "./types/sdk-configuration";
import { ContractDetails, ContractDetailsCodec } from "./types/common";
import { TypeValidationError } from "./errors";
import { isNonEmptyString } from "./utils/basic-utils";
import sdkVersion from "./sdk-version";

export interface GetReauthorizeAccountUrlOptions {
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
     * AccountID to reauthorize.
     */
    accountId: string;
    /**
     * Send preferred locale for authorization client to be used.
     * If passed locale is not supported then language will fallback to browser language.
     * If browser locale is not supported we will fallback to default locale (en).
     */
    locale?: string;
}

const GetReauthorizeAccountUrlOptionsCodec: t.Type<GetReauthorizeAccountUrlOptions> = t.type({
    contractDetails: ContractDetailsCodec,
    callback: t.string,
    userAccessToken: UserAccessTokenCodec,
    accountId: t.string,
});

export interface GetReauthorizeAccountUrlResponse {
    /**
     * The URL to redirect users to to trigger the authorization process.
     */
    url: string;

    /**
     * User access token
     */
    userAccessToken: UserAccessToken;

    /**
     * A session that can be used to read data. Can only be used after a successful authorization
     */
    session: Session;
}

const _accountReference = async (
    { accountId, contractDetails }: GetReauthorizeAccountUrlOptions,
    sdkConfig: SDKConfiguration
): Promise<string> => {
    const { contractId, privateKey } = contractDetails;

    try {
        const { body } = await net.post(`${String(sdkConfig.baseUrl)}reference`, {
            json: {
                type: "accountId",
                value: accountId,
            },
            responseType: "json",
            hooks: {
                beforeRequest: [
                    (options) => {
                        const jwt: string = sign(
                            {
                                client_id: `${sdkConfig.applicationId}_${contractId}`,
                                nonce: getRandomAlphaNumeric(32),
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

        const ref = get(body, "id", {} as string);

        return ref;
    } catch (error) {
        handleServerResponse(error);
        throw error;
    }
};

const _getReauthorizeAccountUrl = async (
    props: GetReauthorizeAccountUrlOptions,
    sdkConfig: SDKConfiguration
): Promise<GetReauthorizeAccountUrlResponse> => {
    if (
        !GetReauthorizeAccountUrlOptionsCodec.is(props) ||
        !isNonEmptyString(props.accountId) ||
        !isNonEmptyString(props.callback)
    ) {
        throw new TypeValidationError("Error on getReauthorizeAccountUrl(). Incorrect parameters passed in.");
    }

    const { userAccessToken, contractDetails, callback, locale } = props;
    const { contractId, privateKey } = contractDetails;

    const response = await net.post(`${String(sdkConfig.baseUrl)}oauth/token/reference`, {
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
        },
        responseType: "json",
        hooks: {
            beforeRequest: [
                (options) => {
                    const jwt: string = sign(
                        {
                            access_token: userAccessToken.accessToken.value,
                            client_id: `${sdkConfig.applicationId}_${contractId}`,
                            nonce: getRandomAlphaNumeric(32),
                            redirect_uri: callback,
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
    const session = get(response.body, "session", {} as GetReauthorizeAccountUrlResponse["session"]);

    const accountRef = await _accountReference(props, sdkConfig);

    const result: URL = new URL(`${String(sdkConfig.onboardUrl)}reauthorize`);
    result.search = new URLSearchParams({
        code,
        accountRef,
        ...(locale && { lng: locale }),
    }).toString();

    return {
        url: result.toString(),
        session,
        userAccessToken: props.userAccessToken,
    };
};

const getReauthorizeAccountUrl = async (
    props: GetReauthorizeAccountUrlOptions,
    sdkConfiguration: SDKConfiguration
): Promise<GetReauthorizeAccountUrlResponse> => {
    return refreshTokenWrapper(_getReauthorizeAccountUrl, props, sdkConfiguration);
};

export { getReauthorizeAccountUrl };
