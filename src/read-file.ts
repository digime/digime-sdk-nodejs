/*!
 * Copyright (c) 2009-2022 digi.me Limited. All rights reserved.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { TypeValidationError } from "./errors";
import { isNonEmptyString } from "./utils/basic-utils";
import { handleServerResponse, net } from "./net";
import { decryptData, getRandomAlphaNumeric } from "./crypto";
import { Response } from "got/dist/source";
import NodeRSA from "node-rsa";
import { isDecodedCAFileHeaderResponse, MappedFileMetadata, RawFileMetadata } from "./types/api/ca-file-response";
import * as zlib from "zlib";
import base64url from "base64url";
import { SDKConfiguration } from "./types/sdk-configuration";
import { UserAccessToken } from "./types/user-access-token";
import { sign } from "jsonwebtoken";

export interface ReadFileOptions {
    sessionKey: string;
    privateKey: NodeRSA.Key;
    fileName: string;
    contractId: string;
    userAccessToken: UserAccessToken;
}

export type ReadFileMeta = MappedFileMetadata | RawFileMetadata;

export interface ReadFileResponse {
    fileData: Buffer;
    fileName: string;
    fileMetadata: ReadFileMeta;
}

const readFile = async (options: ReadFileOptions, sdkConfig: SDKConfiguration): Promise<ReadFileResponse> => {
    const { sessionKey, fileName, privateKey } = options;

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
    };
};

interface FetchFileResponse {
    fileContent: Buffer;
    fileMetadata: MappedFileMetadata | RawFileMetadata;
    compression?: string;
}

const fetchFile = async (options: ReadFileOptions, sdkConfig: SDKConfiguration): Promise<FetchFileResponse> => {
    const { sessionKey, fileName, userAccessToken, contractId, privateKey } = options;

    let response: Response<unknown>;

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
        response = await net.get(`${sdkConfig.baseUrl}permission-access/query/${sessionKey}/${fileName}`, {
            headers: {
                accept: "application/octet-stream",
                Authorization: `Bearer ${jwt}`,
            },
            responseType: "buffer",
        });
    } catch (error) {
        handleServerResponse(error);
        throw error;
    }

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

export { readFile };
