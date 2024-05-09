/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { sign } from "jsonwebtoken";
import { getRandomAlphaNumeric } from "./crypto";
import { TypeValidationError } from "./errors";
import { handleServerResponse, net } from "./net";
import get from "lodash.get";
import { UserAccessToken } from "./types/user-access-token";
import { getPayloadFromToken } from "./utils/get-payload-from-token";
import { SDKConfiguration } from "./types/sdk-configuration";
import { ContractDetails, ContractDetailsCodec } from "./types/common";
import * as t from "io-ts";
import { isNonEmptyString } from "./utils/basic-utils";
import { formatToken } from "./utils/format-token";

export interface ExchangeCodeForTokenOptions {
    contractDetails: ContractDetails;
    codeVerifier: string;
    authorizationCode: string;
}

export const ExchangeCodeForTokenOptionsCodec: t.Type<ExchangeCodeForTokenOptions> = t.type({
    contractDetails: ContractDetailsCodec,
    authorizationCode: t.string,
    codeVerifier: t.string,
});

const exchangeCodeForToken = async (
    options: ExchangeCodeForTokenOptions,
    sdkConfig: SDKConfiguration
): Promise<UserAccessToken> => {
    if (
        !ExchangeCodeForTokenOptionsCodec.is(options) ||
        !isNonEmptyString(options.authorizationCode) ||
        !isNonEmptyString(options.codeVerifier)
    ) {
        throw new TypeValidationError(
            "Parameters failed validation. props should be a plain object that contains the properties contractDetails, authorizationCode and codeVerifier"
        );
    }

    const { authorizationCode, codeVerifier, contractDetails } = options;
    const { contractId, privateKey } = contractDetails;

    const jwt: string = sign(
        {
            client_id: `${sdkConfig.applicationId}_${contractId}`,
            code: authorizationCode,
            code_verifier: codeVerifier,
            grant_type: "authorization_code",
            nonce: getRandomAlphaNumeric(32),
            timestamp: Date.now(),
        },
        privateKey,
        {
            algorithm: "PS512",
            noTimestamp: true,
        }
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

        return formatToken(payload);
    } catch (error) {
        handleServerResponse(error);
        throw error;
    }
};

export { exchangeCodeForToken };
