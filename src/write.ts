/*!
 * Copyright (c) 2009-2022 digi.me Limited. All rights reserved.
 */

import { getRandomAlphaNumeric } from "./crypto";
import { sign } from "jsonwebtoken";
import { TypeValidationError } from "./errors";
import { handleServerResponse, net } from "./net";
import { assertIsPushedFileMeta, PushedFileMeta, PushedFileMetaCodec } from "./types/write";
import { UserAccessToken, UserAccessTokenCodec } from "./types/user-access-token";
import { SDKConfiguration } from "./types/sdk-configuration";
import { ContractDetails, ContractDetailsCodec } from "./types/common";
import * as t from "io-ts";
import urijs from "urijs";
import { Readable } from "stream";
import { refreshTokenWrapper } from "./utils/refresh-token-wrapper";

interface WriteOptions {
    contractDetails: ContractDetails;
    userAccessToken: UserAccessToken;
    data: PushedFileMeta;
}

type WriteResponse = void;

export const WriteOptionsCodec: t.Type<WriteOptions> = t.type({
    contractDetails: ContractDetailsCodec,
    userAccessToken: UserAccessTokenCodec,
    data: PushedFileMetaCodec,
});

const write = async (options: WriteOptions, sdkConfig: SDKConfiguration): Promise<WriteResponse> => {
    const { contractDetails, userAccessToken, data } = options;

    if (!ContractDetailsCodec.is(contractDetails)) {
        throw new TypeValidationError("Contract Details failed type validation.");
    }

    if (!UserAccessTokenCodec.is(userAccessToken)) {
        throw new TypeValidationError("User access token failed type validation.");
    }

    if (!PushedFileMetaCodec.is(data)) {
        throw new TypeValidationError(
            "Data object failed type validation. Is fileData, fileName, fileDescriptor set correctly?"
        );
    }

    assertIsPushedFileMeta(data);

    await refreshTokenWrapper(_write, options, sdkConfig);

    return;
};

const _write: typeof write = async (options, sdkConfig) => {
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

    try {
        await net.post(requestPath.toString(), {
            headers: {
                Authorization: `Bearer ${bearerToken}`,
                contentType: "application/octet-stream",
                FileDescriptor: fileDescriptor,
            },
            body: fileData,
        });

        return;
    } catch (error) {
        handleServerResponse(error);
        throw error;
    }
};

export { WriteOptions, write, WriteResponse };
