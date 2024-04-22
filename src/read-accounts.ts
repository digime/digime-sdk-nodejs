/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { net } from "./net";
import { sign } from "jsonwebtoken";
import { getRandomAlphaNumeric } from "./crypto";
import { UserAccessToken, UserAccessTokenCodec } from "./types/user-access-token";
import { SDKConfiguration } from "./types/sdk-configuration";
import { ContractDetails, ContractDetailsCodec } from "./types/common";
import * as t from "io-ts";
import { TypeValidationError } from "./errors";
import { codecAssertion, CodecAssertion } from "./utils/codec-assertion";
import { refreshTokenWrapper } from "./utils/refresh-token-wrapper";

export interface ReadAccountsOptions {
    contractDetails: ContractDetails;
    userAccessToken: UserAccessToken;
}

export interface AccessTokenStatus {
    authorized: boolean;
    expiresAt?: number;
}

export type AccountType =
    | "USER"
    | "ADMIN"
    | "EVENT"
    | "GROUP"
    | "BANK"
    | "CREDIT_CARD"
    | "IMPORTED"
    | "INVESTMENT"
    | "INSURANCE"
    | "LOAN"
    | "REWARD"
    | "BILL"
    | "PUSH";

export interface AccountsResponse {
    id: string;
    accessTokenStatus?: AccessTokenStatus;
    reference: string;
    type: AccountType;
    createdDate: number;
    serviceGroupId: number;
    serviceGroupName: string;
    serviceProviderId?: number;
    serviceProviderName?: string;
    serviceProviderReference?: string;
    serviceTypeId: number;
    serviceTypeName: string;
    serviceTypeReference: string;
    sourceId: number;
    updatedDate: number;
    username?: string;
    providerFavIcon?: string;
    providerLogo?: string;
    sample?: boolean;
}

export type ReadAccountsResponse = {
    accounts: AccountsResponse[];
    userAccessToken?: UserAccessToken;
};

const AccessTokenStatusCodec: t.Type<AccessTokenStatus> = t.intersection([
    t.type({
        authorized: t.boolean,
    }),
    t.partial({
        expiresAt: t.number,
    }),
]);

const AccountTypeCodec: t.Type<AccountType> = t.keyof({
    USER: null,
    ADMIN: null,
    EVENT: null,
    GROUP: null,
    BANK: null,
    CREDIT_CARD: null,
    IMPORTED: null,
    INVESTMENT: null,
    INSURANCE: null,
    LOAN: null,
    REWARD: null,
    BILL: null,
    PUSH: null,
});

export const AccountsResponseCodec: t.Type<AccountsResponse> = t.intersection([
    t.type({
        id: t.string,
        reference: t.string,
        type: AccountTypeCodec,
        createdDate: t.number,
        serviceGroupId: t.number,
        serviceGroupName: t.string,
        serviceTypeId: t.number,
        serviceTypeName: t.string,
        serviceTypeReference: t.string,
        sourceId: t.number,
        updatedDate: t.number,
    }),
    t.partial({
        accessTokenStatus: AccessTokenStatusCodec,
        serviceProviderId: t.number,
        serviceProviderName: t.string,
        serviceProviderReference: t.string,
        username: t.string,
        providerFavIcon: t.string,
        providerLogo: t.string,
        sample: t.boolean,
    }),
]);

export const ReadAccountsResponseCodec: t.Type<ReadAccountsResponse> = t.strict({
    accounts: t.array(AccountsResponseCodec),
});

export const assertIsReadAccountsResponse: CodecAssertion<ReadAccountsResponse> =
    codecAssertion(ReadAccountsResponseCodec);

export const ReadAccountsOptionsCodec: t.Type<ReadAccountsOptions> = t.type({
    contractDetails: ContractDetailsCodec,
    userAccessToken: UserAccessTokenCodec,
});

const _readAccounts = async (
    options: ReadAccountsOptions,
    sdkConfig: SDKConfiguration
): Promise<ReadAccountsResponse> => {
    if (!ReadAccountsOptionsCodec.is(options)) {
        throw new TypeValidationError(
            "Parameters failed validation. props should be a plain object that contains the properties contractDetails and userAccessToken"
        );
    }

    const { contractDetails, userAccessToken } = options;
    const { contractId, privateKey } = contractDetails;

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

    const url = `${sdkConfig.baseUrl}permission-access/accounts`;

    const response = await net.get(url, {
        headers: {
            Authorization: `Bearer ${jwt}`,
        },
        responseType: "json",
        retry: sdkConfig.retryOptions,
    });

    const formatedAccounts = {
        accounts: response.body,
        userAccessToken,
    };

    assertIsReadAccountsResponse(formatedAccounts);

    return formatedAccounts;
};

const readAccounts = async (
    props: ReadAccountsOptions,
    sdkConfiguration: SDKConfiguration
): Promise<ReadAccountsResponse> => {
    return refreshTokenWrapper(_readAccounts, props, sdkConfiguration);
};

export { readAccounts };
