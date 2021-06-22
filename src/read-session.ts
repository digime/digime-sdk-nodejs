/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import { net } from "./net";
import { sign } from "jsonwebtoken";
import { getRandomAlphaNumeric } from "./crypto";
import get from "lodash.get";
import { assertIsSession, Session } from "./types/api/session";
import { UserAccessToken, UserAccessTokenCodec } from "./types/user-access-token";
import { SDKConfiguration } from "./types/sdk-configuration";
import { CAScope, CAScopeCodec, ContractDetails, ContractDetailsCodec } from "./types/common";
import * as t from "io-ts";
import { TypeValidationError } from "./errors";
import { refreshTokenWrapper } from "./utils/refresh-token-wrapper";

export interface ReadSessionOptions {
    contractDetails: ContractDetails;
    userAccessToken: UserAccessToken;
    scope?: CAScope;
}

export interface ReadSessionResponse {
    session: Session;
    userAccessToken?: UserAccessToken;
}

export const ReadSessionOptionsCodec: t.Type<ReadSessionOptions> = t.intersection([
    t.type({
        contractDetails: ContractDetailsCodec,
        userAccessToken: UserAccessTokenCodec,
    }),
    t.partial({
        scope: CAScopeCodec,
    }),
]);

const _readSession = async (options: ReadSessionOptions, sdkConfig: SDKConfiguration): Promise<ReadSessionResponse> => {
    if (!ReadSessionOptionsCodec.is(options)) {
        // tslint:disable-next-line:max-line-length
        throw new TypeValidationError(
            "Parameters failed validation. props should be a plain object that contains the properties contractDetails and userAccessToken. If scope is passed in, please ensure it's the right format."
        );
    }

    const { contractDetails, userAccessToken, scope } = options;

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

    const url = `${sdkConfig.baseUrl}permission-access/trigger`;

    const response = await net.post(url, {
        headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json", // NOTE: we might not need this
        },
        json: {
            scope,
        },
        responseType: "json",
    });

    const session: unknown = get(response, "body.session");
    assertIsSession(session);

    return {
        session,
        userAccessToken,
    };
};

const readSession = async (
    props: ReadSessionOptions,
    sdkConfiguration: SDKConfiguration
): Promise<ReadSessionResponse> => {
    return refreshTokenWrapper(_readSession, props, sdkConfiguration);
};

export { readSession };
