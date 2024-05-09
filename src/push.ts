/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { getRandomAlphaNumeric } from "./crypto";
import { sign } from "jsonwebtoken";
import { TypeValidationError } from "./errors";
import { net } from "./net";
import { assertIsPushedFileMeta, PushedFileMeta, PushedFileMetaCodec } from "./types/push";
import { UserAccessToken, UserAccessTokenCodec } from "./types/user-access-token";
import { SDKConfiguration } from "./types/sdk-configuration";
import { ContractDetails, ContractDetailsCodec } from "./types/common";
import * as t from "io-ts";
import urijs from "urijs";
import { Readable } from "stream";
import { refreshTokenWrapper } from "./utils/refresh-token-wrapper";
import isFunction from "lodash.isfunction";

type AccessTokenChangeHandler = (response: UserAccessToken) => void;

export interface PushDataToLibraryOptions {
    type: "library";
    contractDetails: ContractDetails;
    userAccessToken: UserAccessToken;
    data: PushedFileMeta;
    onAccessTokenChange?: AccessTokenChangeHandler;
}

export interface PushDataToProviderOptions {
    type: "provider";
    contractDetails: ContractDetails;
    userAccessToken: UserAccessToken;
    data: Record<string, unknown>;
    version: "stu3" | "3.0.2";
    standard: "fhir";
    accountId: string;
    onAccessTokenChange?: AccessTokenChangeHandler;
}

export type PushDataOptions = PushDataToLibraryOptions | PushDataToProviderOptions;

type PushDataInternalResponse = {
    userAccessToken?: UserAccessToken;
};

export const PushLibraryOptionsCodec: t.Type<PushDataToLibraryOptions> = t.type({
    type: t.literal("library"),
    contractDetails: ContractDetailsCodec,
    userAccessToken: UserAccessTokenCodec,
    data: PushedFileMetaCodec,
});

export const PushProviderOptionsCodec: t.Type<PushDataToProviderOptions> = t.type({
    type: t.literal("provider"),
    contractDetails: ContractDetailsCodec,
    userAccessToken: UserAccessTokenCodec,
    data: t.record(t.string, t.unknown),
    version: t.union([t.literal("stu3"), t.literal("3.0.2")]),
    standard: t.literal("fhir"),
    accountId: t.string,
});

const pushData = async (options: PushDataOptions, sdkConfig: SDKConfiguration): Promise<void> => {
    const { type, contractDetails, userAccessToken, onAccessTokenChange } = options;

    let pushResponse;

    if (!ContractDetailsCodec.is(contractDetails)) {
        throw new TypeValidationError("Contract Details failed type validation.");
    }

    if (!UserAccessTokenCodec.is(userAccessToken)) {
        throw new TypeValidationError("User access token failed type validation.");
    }
    if (type === "library") {
        if (!PushLibraryOptionsCodec.is(options)) {
            throw new TypeValidationError("Push to library type validation failed.");
        }
        pushResponse = await pushToLibrary(options, sdkConfig);
    }

    if (type === "provider") {
        if (!PushProviderOptionsCodec.is(options)) {
            throw new TypeValidationError("Push to provider type validation failed.");
        }
        pushResponse = await pushToProvider(options, sdkConfig);
    }

    if (
        pushResponse?.userAccessToken &&
        pushResponse?.userAccessToken !== userAccessToken &&
        isFunction(onAccessTokenChange)
    ) {
        onAccessTokenChange(pushResponse?.userAccessToken);
    }
};

const _pushToLibrary = async (
    options: PushDataToLibraryOptions,
    sdkConfig: SDKConfiguration
): Promise<PushDataInternalResponse> => {
    const { userAccessToken, contractDetails, data } = options;

    const fileData = Buffer.isBuffer(data.fileData) ? Readable.from(data.fileData) : data.fileData;

    const { contractId, privateKey } = contractDetails;

    const requestPath = urijs(`${sdkConfig.baseUrl}permission-access/import`);

    const bearerToken: string = sign(
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

    const fileDescriptor = sign(
        {
            metadata: data.fileDescriptor,
        },
        privateKey.toString(),
        {
            algorithm: "PS512",
            noTimestamp: true,
        }
    );

    await net.post(requestPath.toString(), {
        headers: {
            Authorization: `Bearer ${bearerToken}`,
            contentType: "application/octet-stream",
            FileDescriptor: fileDescriptor,
        },
        body: fileData,
    });

    return {
        userAccessToken,
    };
};

const pushToLibrary = async (
    props: PushDataToLibraryOptions,
    sdkConfig: SDKConfiguration
): Promise<PushDataInternalResponse> => {
    const { data } = props;

    if (!PushedFileMetaCodec.is(data)) {
        throw new TypeValidationError(
            "Data object failed type validation. Is fileData, fileName, fileDescriptor set correctly?"
        );
    }

    assertIsPushedFileMeta(data);

    return await refreshTokenWrapper(_pushToLibrary, props, sdkConfig);
};

const _pushToProvider = async (
    options: PushDataToProviderOptions,
    sdkConfig: SDKConfiguration
): Promise<PushDataInternalResponse> => {
    const { userAccessToken, contractDetails, data, version, standard, accountId } = options;

    const { contractId, privateKey } = contractDetails;

    const requestPath = urijs(`${sdkConfig.baseUrl}permission-access/import/h:accountId/${standard}/${version}`);

    const bearerToken: string = sign(
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

    await net.post(requestPath.toString(), {
        headers: {
            Authorization: `Bearer ${bearerToken}`,
            contentType: "application/json",
            accountId,
        },
        json: data,
        responseType: "json",
    });

    return {
        userAccessToken,
    };
};

const pushToProvider = async (
    props: PushDataToProviderOptions,
    sdkConfig: SDKConfiguration
): Promise<PushDataInternalResponse> => {
    return await refreshTokenWrapper(_pushToProvider, props, sdkConfig);
};

export { pushData };
