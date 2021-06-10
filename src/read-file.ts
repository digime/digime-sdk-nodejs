/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import { TypeValidationError } from "./errors";
import { isNonEmptyString } from "./utils/basic-utils";
import { handleInvalidatedSdkResponse, net } from "./net";
import { decryptData } from "./crypto";
import { Response } from "got/dist/source";
import NodeRSA from "node-rsa";
import { isDecodedCAFileHeaderResponse, MappedFileMetadata, RawFileMetadata } from "./types/api/ca-file-response";
import * as zlib from "zlib";
import base64url from "base64url";
import { AcceptedSDKConfiguration } from "./types/dme-sdk-configuration";

interface ReadFileOptions {
    sessionKey: string;
    privateKey: NodeRSA.Key;
    fileName: string;
}

type ReadFileMeta = MappedFileMetadata | RawFileMetadata;

interface ReadFileResponse {
    fileData: Buffer;
    fileName: string;
    fileMetadata: ReadFileMeta;
}

const readFile = async (
    options: ReadFileOptions,
    sdkConfig: AcceptedSDKConfiguration,
): Promise<ReadFileResponse> => {

    const { sessionKey, fileName, privateKey } = options;

    if (!isNonEmptyString(sessionKey)) {
        throw new TypeValidationError("Parameter sessionKey should be a non empty string");
    }

    const response = await fetchFile({sessionKey, fileName}, sdkConfig);
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

interface FetchFileProps {
    sessionKey: string;
    fileName: string;
}

const fetchFile = async (
    options: FetchFileProps,
    sdkConfig: AcceptedSDKConfiguration,
): Promise<FetchFileResponse> => {

    const { sessionKey, fileName } = options;

    let response: Response<unknown>;

    try {
        response = await net.get(`${sdkConfig.baseUrl}permission-access/query/${sessionKey}/${fileName}`, {
            headers: {
                accept: "application/octet-stream",
            },
            responseType: "buffer",
        })
    } catch (error) {

        handleInvalidatedSdkResponse(error);

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

export {
    readFile,
    ReadFileOptions,
    ReadFileResponse,
    ReadFileMeta,
};
