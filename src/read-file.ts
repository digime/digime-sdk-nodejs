/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { TypeValidationError } from "./errors";
import { isNonEmptyString } from "./utils/basic-utils";
import { net } from "./net";
import { decryptData, getRandomAlphaNumeric } from "./crypto";
import NodeRSA from "node-rsa";
import { isDecodedCAFileHeaderResponse, MappedFileMetadata, RawFileMetadata } from "./types/api/ca-file-response";
import * as zlib from "zlib";
import base64url from "base64url";
import { SDKConfiguration } from "./types/sdk-configuration";
import { UserAccessToken } from "./types/user-access-token";
import { sign } from "jsonwebtoken";
import { refreshTokenWrapper } from "./utils/refresh-token-wrapper";
import { ContractDetails } from "./types/common";

export interface ReadFileOptions {
    sessionKey: string;
    privateKey: NodeRSA.Key;
    fileName: string;
    contractId: string;
    userAccessToken: UserAccessToken;
}

interface ReadFileOptionsFormated {
    sessionKey: string;
    fileName: string;
    userAccessToken: UserAccessToken;
    contractDetails: ContractDetails;
}

export type ReadFileMeta = MappedFileMetadata | RawFileMetadata;

export interface ReadFileResponse {
    fileData: Buffer;
    fileName: string;
    fileMetadata: ReadFileMeta;
    userAccessToken?: UserAccessToken;
}

const _readFile = async (options: ReadFileOptionsFormated, sdkConfig: SDKConfiguration): Promise<ReadFileResponse> => {
    const { sessionKey, fileName, userAccessToken } = options;
    const { privateKey } = options.contractDetails;

    if (!isNonEmptyString(sessionKey)) {
        throw new TypeValidationError("Parameter sessionKey should be a non empty string");
    }

    const response = await fetchFile(options, sdkConfig);
    const { compression, fileContent, fileMetadata } = response;
    const key: NodeRSA = new NodeRSA(privateKey, "pkcs1-private-pem");
    let data: Buffer = decryptData(key, fileContent);

    if (compression === "brotli") {
        data = zlib.brotliDecompressSync(data);
    } else if (compression === "gzip") {
        data = zlib.gunzipSync(data);
    }

    return {
        fileData: data,
        fileMetadata,
        fileName,
        userAccessToken,
    };
};

interface FetchFileResponse {
    fileContent: Buffer;
    fileMetadata: MappedFileMetadata | RawFileMetadata;
    compression?: string;
}

const fetchFile = async (options: ReadFileOptionsFormated, sdkConfig: SDKConfiguration): Promise<FetchFileResponse> => {
    const { sessionKey, fileName, userAccessToken } = options;
    const { privateKey, contractId } = options.contractDetails;

    const response = await net.get(`${sdkConfig.baseUrl}permission-access/query/${sessionKey}/${fileName}`, {
        headers: {
            accept: "application/octet-stream",
        },
        responseType: "buffer",
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

    const fileContent: Buffer = response.body as Buffer;
    const base64Meta: string = response.headers["x-metadata"] as string;
    const decodedMeta: any = JSON.parse(base64url.decode(base64Meta));

    isDecodedCAFileHeaderResponse(decodedMeta);

    return {
        compression: decodedMeta.compression,
        fileContent,
        fileMetadata: decodedMeta.metadata,
    };
};

const readFile = async (options: ReadFileOptions, sdkConfig: SDKConfiguration): Promise<ReadFileResponse> => {
    const formatedOptions: ReadFileOptionsFormated = {
        sessionKey: options.sessionKey,
        fileName: options.fileName,
        userAccessToken: options.userAccessToken,
        contractDetails: {
            contractId: options.contractId,
            privateKey: options.privateKey.toString(),
        },
    };
    return refreshTokenWrapper(_readFile, formatedOptions, sdkConfig);
};

export { readFile };
