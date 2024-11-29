/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { TypeValidationError } from "./errors";
import { isNonEmptyString } from "./utils/basic-utils";
import { net } from "./net";
import { getRandomAlphaNumeric } from "./crypto";
import { assertIsDecodedCAFileHeaderResponse, MappedFileMetadata, RawFileMetadata } from "./types/api/ca-file-response";
import base64url from "base64url";
import { SDKConfiguration } from "./types/sdk-configuration";
import { UserAccessToken } from "./types/user-access-token";
import { sign } from "jsonwebtoken";
import { refreshTokenWrapper } from "./utils/refresh-token-wrapper";
import { ContractDetails } from "./types/common";

export interface ReadFileMetadataOptions {
    sessionKey: string;
    fileName: string;
    userAccessToken: UserAccessToken;
    contractDetails: ContractDetails;
}

export type ReadFileMeta = MappedFileMetadata | RawFileMetadata;

export interface ReadFileMetadataResponse {
    fileMetadata: ReadFileMeta;
    fileName: string;
    userAccessToken?: UserAccessToken;
}

const _readFileMetadata = async (
    options: ReadFileMetadataOptions,
    sdkConfig: SDKConfiguration
): Promise<ReadFileMetadataResponse> => {
    const { sessionKey, fileName, userAccessToken } = options;

    if (!isNonEmptyString(sessionKey)) {
        throw new TypeValidationError("Parameter sessionKey should be a non empty string");
    }

    if (!isNonEmptyString(fileName)) {
        throw new TypeValidationError("Parameter fileName should be a non empty string");
    }

    const response = await fetchFileMetadata(options, sdkConfig);
    const { fileMetadata } = response;

    return {
        fileMetadata,
        fileName,
        userAccessToken,
    };
};

interface FetchMetadataFileResponse {
    fileMetadata: MappedFileMetadata | RawFileMetadata;
}

const fetchFileMetadata = async (
    options: ReadFileMetadataOptions,
    sdkConfig: SDKConfiguration
): Promise<FetchMetadataFileResponse> => {
    const { sessionKey, fileName, userAccessToken } = options;
    const { privateKey, contractId } = options.contractDetails;

    const response = await net.head(`${String(sdkConfig.baseUrl)}permission-access/query/${sessionKey}/${fileName}`, {
        headers: {
            accept: "application/json",
        },
        retry: sdkConfig.retryOptions,
        hooks: {
            beforeRequest: [
                (options) => {
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
                    options.headers["Authorization"] = `Bearer ${jwt}`;
                },
            ],
        },
    });
    const base64Meta: string = response.headers["x-metadata"] as string;
    let decodedMeta: unknown;

    if (base64Meta) {
        decodedMeta = JSON.parse(base64url.decode(base64Meta));
    }

    assertIsDecodedCAFileHeaderResponse(decodedMeta);

    return {
        fileMetadata: decodedMeta.metadata,
    };
};

const readFileMetadata = async (
    options: ReadFileMetadataOptions,
    sdkConfig: SDKConfiguration
): Promise<ReadFileMetadataResponse> => {
    return refreshTokenWrapper(_readFileMetadata, options, sdkConfig);
};

export { readFileMetadata };
