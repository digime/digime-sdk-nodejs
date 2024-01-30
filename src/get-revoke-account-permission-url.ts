/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { getRandomAlphaNumeric } from "./crypto";
import { sign } from "jsonwebtoken";
import { net, handleServerResponse } from "./net";
import { UserAccessToken } from "./types/user-access-token";
import { SDKConfiguration } from "./types/sdk-configuration";
import { ContractDetails } from "./types/common";
import { CodecAssertion, codecAssertion } from "./utils/codec-assertion";
import * as t from "io-ts";

export interface GetRevokeAccountPermissionUrlOptions {
    contractDetails: ContractDetails;
    userAccessToken: UserAccessToken;
    accountId: string;
    redirectUri: string;
}

export interface GetRevokeAccountPermissionUrlResponse {
    location: string;
}

const GetRevokeAccountPermissionResponseUrlCodec = t.type({
    location: t.string,
});

export const assertIsGetRevokeAccountPermissionUrlResponse: CodecAssertion<GetRevokeAccountPermissionUrlResponse> =
    codecAssertion(GetRevokeAccountPermissionResponseUrlCodec);

const getRevokeAccountPermissionUrl = async (
    options: GetRevokeAccountPermissionUrlOptions,
    sdkConfig: SDKConfiguration
): Promise<GetRevokeAccountPermissionUrlResponse> => {
    const { userAccessToken, contractDetails, accountId, redirectUri } = options;
    const { contractId, privateKey } = contractDetails;

    const url = `${sdkConfig.baseUrl}permission-access/revoke/h:accountId`;

    const jwt: string = sign(
        {
            access_token: userAccessToken.accessToken.value,
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

    try {
        const response = await net.get(url, {
            headers: {
                Authorization: `Bearer ${jwt}`,
                accept: "application/json",
                accountId,
                redirectUri,
            },
            retry: sdkConfig.retryOptions,
            responseType: "json",
        });

        assertIsGetRevokeAccountPermissionUrlResponse(response.body);

        return response.body;
    } catch (error) {
        handleServerResponse(error);
        throw error;
    }
};

export { getRevokeAccountPermissionUrl };
