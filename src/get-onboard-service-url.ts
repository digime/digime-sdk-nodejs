/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import * as t from "io-ts";
import get from "lodash.get";
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
import { TypeValidationError } from "./errors";
import { isNonEmptyString } from "./utils/basic-utils";
import sdkVersion from "./sdk-version";

export interface GetOnboardServiceUrlOptions {
    contractDetails: ContractDetails;
    callback: string;
    userAccessToken: UserAccessToken;
    serviceId: number;
}

const GetOnboardServiceUrlCodec: t.Type<GetOnboardServiceUrlOptions> = t.type({
    contractDetails: ContractDetailsCodec,
    callback: t.string,
    userAccessToken: UserAccessTokenCodec,
    serviceId: t.number,
});

export interface GetOnboardServiceUrlResponse {
    session: Session;
    userAccessToken: UserAccessToken;
    url: string;
}

const _getOnboardServiceUrl = async (
    props: GetOnboardServiceUrlOptions,
    sdkConfig: SDKConfiguration
): Promise<GetOnboardServiceUrlResponse> => {
    if (!GetOnboardServiceUrlCodec.is(props) || isNaN(props.serviceId) || !isNonEmptyString(props.callback)) {
        throw new TypeValidationError("Error on getOnboardServiceUrl(). Incorrect parameters passed in.");
    }

    const { userAccessToken, contractDetails } = props;
    const { contractId, privateKey, redirectUri } = contractDetails;

    const jwt: string = sign(
        {
            access_token: userAccessToken.accessToken.value,
            client_id: `${sdkConfig.applicationId}_${contractId}`,
            nonce: getRandomAlphaNumeric(32),
            redirect_uri: redirectUri,
            timestamp: Date.now(),
        },
        privateKey.toString(),
        {
            algorithm: "PS512",
            noTimestamp: true,
        }
    );

    const response = await net.post(`${sdkConfig.baseUrl}oauth/token/reference`, {
        headers: {
            Authorization: `Bearer ${jwt}`,
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
    });

    const payload = await getPayloadFromToken(get(response.body, "token"), sdkConfig);
    const code = get(payload, ["reference_code"]);
    const session = get(response.body, "session", {} as GetOnboardServiceUrlResponse["session"]);

    const result: URL = new URL(`${sdkConfig.onboardUrl}onboard`);
    result.search = new URLSearchParams({
        code,
        callback: props.callback,
        service: props.serviceId.toString(),
    }).toString();

    return {
        url: result.toString(),
        session,
        userAccessToken: props.userAccessToken,
    };
};

const getOnboardServiceUrl = async (
    props: GetOnboardServiceUrlOptions,
    sdkConfiguration: SDKConfiguration
): Promise<GetOnboardServiceUrlResponse> => {
    return refreshTokenWrapper(_getOnboardServiceUrl, props, sdkConfiguration);
};

export { getOnboardServiceUrl };
