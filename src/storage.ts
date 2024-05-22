/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { handleServerResponse, net } from "./net";
import { sign } from "jsonwebtoken";
import { createDecryptStream, createEncryptStream, getRandomAlphaNumeric } from "./crypto";
import { SDKConfiguration } from "./types/sdk-configuration";
import { ContractDetails, ContractDetailsCodec } from "./types/common";
import * as t from "io-ts";
import { DigiMeSDKError, TypeValidationError } from "./errors";
import { codecAssertion, CodecAssertion } from "./utils/codec-assertion";
import { addLeadingAndTrailingSlash, addLeadingSlash } from "./utils/basic-utils";
import { Readable } from "stream";
import { ReadableStream } from "stream/web";
import { UserAccessToken, UserAccessTokenCodec } from "./types/user-access-token";
import { refreshTokenWrapper } from "./utils/refresh-token-wrapper";

// begin createProvisionalStorage
export interface CreateProvisionalStorageOptions {
    contractDetails: ContractDetails;
}

export interface CreateProvisionalStorageResponse {
    storage: {
        id: string;
        kid: string;
    };
}

export const CreateProvisionalStorageResponseCodec: t.Type<CreateProvisionalStorageResponse> = t.type({
    storage: t.type({
        id: t.string,
        kid: t.string,
    }),
});

export const assertIsCreateProvisionalStorageResponse: CodecAssertion<CreateProvisionalStorageResponse> =
    codecAssertion(CreateProvisionalStorageResponseCodec);

export const CreateProvisionalStorageOptionsCodec: t.Type<CreateProvisionalStorageOptions> = t.type({
    contractDetails: ContractDetailsCodec,
});

const createProvisionalStorage = async (
    options: CreateProvisionalStorageOptions,
    sdkConfig: SDKConfiguration
): Promise<CreateProvisionalStorageResponse> => {
    if (!CreateProvisionalStorageOptionsCodec.is(options)) {
        throw new TypeValidationError(
            "Parameters failed validation. props should be a plain object that contains contractDetails"
        );
    }

    const { contractDetails } = options;
    const { contractId, privateKey } = contractDetails;

    try {
        const response = await net.post(`${sdkConfig.baseUrl}storage`, {
            headers: {
                "Content-Type": "application/json",
            },
            responseType: "json",
            hooks: {
                beforeRequest: [
                    (options) => {
                        const jwt: string = sign(
                            {
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

        const formatedStorage = { storage: response.body };

        assertIsCreateProvisionalStorageResponse(formatedStorage);

        return formatedStorage;
    } catch (error) {
        handleServerResponse(error);
        throw new DigiMeSDKError("Problem with creating storage");
    }
};

// end createProvisionalStorage

// begin getUserStorage
export interface GetUserStorageOptions {
    contractDetails: ContractDetails;
    userAccessToken: UserAccessToken;
}

export interface GetUserStorageResponse {
    storage: {
        id: string;
        kid: string;
    };
    userAccessToken?: UserAccessToken;
}

export const GetUserStorageResponseCodec: t.Type<GetUserStorageResponse> = t.type({
    storage: t.type({
        id: t.string,
        kid: t.string,
    }),
});

export const assertIsGetUserStorageResponse: CodecAssertion<GetUserStorageResponse> =
    codecAssertion(GetUserStorageResponseCodec);

export const GetUserStorageOptionsCodec: t.Type<GetUserStorageOptions> = t.type({
    contractDetails: ContractDetailsCodec,
    userAccessToken: UserAccessTokenCodec,
});

const _getUserStorage = async (
    options: GetUserStorageOptions,
    sdkConfig: SDKConfiguration
): Promise<GetUserStorageResponse> => {
    if (!GetUserStorageOptionsCodec.is(options)) {
        throw new TypeValidationError(
            "Parameters failed validation. props should be a plain object that contains contractDetails"
        );
    }

    const { contractDetails, userAccessToken } = options;
    const { contractId, privateKey } = contractDetails;

    const response = await net.get(`${sdkConfig.baseUrl}storage`, {
        headers: {
            "Content-Type": "application/json",
        },
        responseType: "json",
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

    const formatedStorage = { storage: response.body };

    assertIsCreateProvisionalStorageResponse(formatedStorage);

    return formatedStorage;
};

const getUserStorage = async (
    props: GetUserStorageOptions,
    sdkConfiguration: SDKConfiguration
): Promise<GetUserStorageResponse> => {
    return refreshTokenWrapper(_getUserStorage, props, sdkConfiguration);
};

// end getUserStorage

// begin listStorageFiles
export interface ListStorageFilesOptions {
    contractDetails: ContractDetails;
    storageId: string;
    path?: string;
    recursive?: boolean;
}

interface StorageFile {
    id: string;
    name: string;
    originalName: string;
    originalPath: string;
    path: string;
}

export const StorageFileCodec: t.Type<StorageFile> = t.type({
    id: t.string,
    name: t.string,
    originalName: t.string,
    originalPath: t.string,
    path: t.string,
});

export interface ListStorageFilesResponse {
    files: StorageFile[];
    total: number;
}

export const ListStorageFilesOptionsResponseCodec: t.Type<ListStorageFilesResponse> = t.type({
    files: t.array(StorageFileCodec),
    total: t.number,
});

export const assertIsListStorageFilesOptionsResponseCodec: CodecAssertion<ListStorageFilesResponse> = codecAssertion(
    ListStorageFilesOptionsResponseCodec
);

export const ListStorageFilesOptionsCodec: t.Type<ListStorageFilesOptions> = t.intersection([
    t.type({
        contractDetails: ContractDetailsCodec,
        storageId: t.string,
    }),
    t.partial({
        path: t.string,
        recursive: t.boolean,
    }),
]);

const listStorageFiles = async (
    options: ListStorageFilesOptions,
    sdkConfig: SDKConfiguration
): Promise<ListStorageFilesResponse> => {
    if (!ListStorageFilesOptionsCodec.is(options)) {
        throw new TypeValidationError(
            "Parameters failed validation. Props should be a plain object that contains contractDetails and storageId"
        );
    }

    const { contractDetails, storageId, recursive, path } = options;
    const { contractId, privateKey } = contractDetails;

    const formatedPath = addLeadingAndTrailingSlash(path);

    try {
        const response = await net.get(
            `${sdkConfig.cloudBaseUrl}clouds/${storageId}/files/apps/${
                sdkConfig.applicationId
            }${formatedPath}?recursive=${recursive ? "true" : "false"}`,
            {
                responseType: "json",
                hooks: {
                    beforeRequest: [
                        (options) => {
                            const jwt: string = sign(
                                {
                                    sub: sdkConfig.applicationId,
                                    iss: contractId,
                                    aud: "cloud",
                                    iat: Math.floor(Date.now() / 1000),
                                    exp: Math.floor(Date.now() / 1000 + 60),
                                },
                                privateKey.toString(),
                                {
                                    algorithm: "PS512",
                                    keyid: `${contractId}_${sdkConfig.applicationId}_0`,
                                    header: {
                                        typ: "at+jwt",
                                        alg: "PS512",
                                        kid: `${contractId}_${sdkConfig.applicationId}_0`,
                                    },
                                }
                            );
                            options.headers["Authorization"] = `Bearer ${jwt}`;
                        },
                    ],
                },
            }
        );

        assertIsListStorageFilesOptionsResponseCodec(response.body);

        const formatedFiles: StorageFile[] = response.body.files.map((file: StorageFile) => {
            return {
                ...file,
                originalPath: file.originalPath.split(`/apps/${sdkConfig.applicationId}`)[1],
                path: file.path.split(`/apps/${sdkConfig.applicationId.toLowerCase()}`)[1],
            };
        });

        return { files: formatedFiles, total: response.body.total };
    } catch (error) {
        handleServerResponse(error);
        throw new DigiMeSDKError("Problem with getting list of files");
    }
};

// end listStorageFiles

// begin downloadStorageFile
export interface DownloadStorageFileOptions {
    contractDetails: ContractDetails;
    storageId: string;
    path?: string;
}

const ReadableStreamCodec = new t.Type<ReadableStream, ReadableStream, unknown>(
    "ReadableStream",
    (input: unknown): input is ReadableStream => input instanceof ReadableStream,
    // `t.success` and `t.failure` are helpers used to build `Either` instances
    (input, context) =>
        input instanceof ReadableStream
            ? t.success(input)
            : t.failure(input, context, "Cannot parse into ReadableStream"),
    // `A` and `O` are the same, so `encode` is just the identity function
    t.identity
);

export interface DownloadStorageFileResponse {
    body: ReadableStream;
    contentLength?: number;
}

export const DownloadStorageFileResponseCodec: t.Type<DownloadStorageFileResponse> = t.type({
    body: ReadableStreamCodec,
});

export const assertIsDownloadStorageFileOptionsResponseCodec: CodecAssertion<DownloadStorageFileResponse> =
    codecAssertion(DownloadStorageFileResponseCodec);

export const DownloadStorageFileOptionsCodec: t.Type<DownloadStorageFileOptions> = t.intersection([
    t.type({
        contractDetails: ContractDetailsCodec,
        storageId: t.string,
    }),
    t.partial({
        path: t.string,
    }),
]);

const downloadStorageFile = async (
    options: DownloadStorageFileOptions,
    sdkConfig: SDKConfiguration
): Promise<DownloadStorageFileResponse> => {
    if (!DownloadStorageFileOptionsCodec.is(options)) {
        throw new TypeValidationError(
            "Parameters failed validation. Props should be a plain object that contains contractDetails and storageId"
        );
    }

    const { contractDetails, storageId, path } = options;
    const { contractId, privateKey } = contractDetails;

    const formatedPath = addLeadingSlash(path);

    try {
        const readStream = net.stream(
            `${sdkConfig.cloudBaseUrl}clouds/${storageId}/files/apps/${sdkConfig.applicationId}${formatedPath}`,
            {
                headers: {
                    accept: "application/octet-stream",
                },
                hooks: {
                    beforeRequest: [
                        (options) => {
                            const jwt: string = sign(
                                {
                                    sub: sdkConfig.applicationId,
                                    iss: contractId,
                                    aud: "cloud",
                                    iat: Math.floor(Date.now() / 1000),
                                    exp: Math.floor(Date.now() / 1000 + 60),
                                },
                                privateKey.toString(),
                                {
                                    algorithm: "PS512",
                                    keyid: `${contractId}_${sdkConfig.applicationId}_0`,
                                    header: {
                                        typ: "at+jwt",
                                        alg: "PS512",
                                        kid: `${contractId}_${sdkConfig.applicationId}_0`,
                                    },
                                }
                            );
                            options.headers["Authorization"] = `Bearer ${jwt}`;
                        },
                    ],
                },
                throwHttpErrors: false,
            }
        );

        return await new Promise((resolve, reject) => {
            readStream.once("response", () => {
                const responsePipeline = readStream.pipe(createDecryptStream(privateKey));
                const result: DownloadStorageFileResponse = {
                    body: Readable.toWeb(responsePipeline),
                };
                resolve(result);
            });

            readStream.once("error", (error) => {
                reject(error);
            });
        });
    } catch (error) {
        handleServerResponse(error);
        throw new DigiMeSDKError("Problem with file download.");
    }
};

// end listStorageFiles

// begin deleteStorageFiles
export interface DeleteStorageFilesOptions {
    contractDetails: ContractDetails;
    storageId: string;
    path?: string;
}

export interface DeleteStorageFilesResponse {
    deleted: boolean;
    statusCode: number;
    statusMessage?: string;
}

export const DeleteStorageFilesOptionsCodec: t.Type<DeleteStorageFilesOptions> = t.intersection([
    t.type({
        contractDetails: ContractDetailsCodec,
        storageId: t.string,
    }),
    t.partial({
        path: t.string,
    }),
]);

const deleteStorageFiles = async (
    options: DeleteStorageFilesOptions,
    sdkConfig: SDKConfiguration
): Promise<DeleteStorageFilesResponse> => {
    if (!DeleteStorageFilesOptionsCodec.is(options)) {
        throw new TypeValidationError(
            "Parameters failed validation. Props should be a plain object that contains contractDetails and contractDetails"
        );
    }
    try {
        const { contractDetails, storageId, path } = options;
        const { contractId, privateKey } = contractDetails;

        const response = await net.delete(
            `${sdkConfig.cloudBaseUrl}clouds/${storageId}/files/apps/${sdkConfig.applicationId}${path}`,
            {
                retry: sdkConfig.retryOptions,
                hooks: {
                    beforeRequest: [
                        (options) => {
                            const jwt: string = sign(
                                {
                                    sub: sdkConfig.applicationId,
                                    iss: contractId,
                                    aud: "cloud",
                                    iat: Math.floor(Date.now() / 1000),
                                    exp: Math.floor(Date.now() / 1000 + 60),
                                },
                                privateKey.toString(),
                                {
                                    algorithm: "PS512",
                                    keyid: `${contractId}_${sdkConfig.applicationId}_0`,
                                    header: {
                                        typ: "at+jwt",
                                        alg: "PS512",
                                        kid: `${contractId}_${sdkConfig.applicationId}_0`,
                                    },
                                }
                            );
                            options.headers["Authorization"] = `Bearer ${jwt}`;
                        },
                    ],
                },
            }
        );

        return {
            deleted: true,
            statusCode: response.statusCode,
            statusMessage: response.statusMessage,
        };
    } catch (error) {
        handleServerResponse(error);
        throw error;
    }
};

// end deleteStorageFiles

// begin uploadFileToStorage

export interface UploadFileToStorageOptions {
    contractDetails: ContractDetails;
    storageId: string;
    fileData: Readable | Buffer;
    fileName: string;
    path?: string;
}

export interface UploadFileToStorageResponse {
    uploaded: boolean;
    statusCode: number;
    statusMessage?: string;
}

const buffer = new t.Type<Buffer, Buffer, unknown>(
    "Buffer",
    (input: unknown): input is Buffer => Buffer.isBuffer(input),
    // `t.success` and `t.failure` are helpers used to build `Either` instances
    (input, context) =>
        Buffer.isBuffer(input) ? t.success(input) : t.failure(input, context, "Cannot parse into Buffer"),
    // `A` and `O` are the same, so `encode` is just the identity function
    t.identity
);

const readableStream = new t.Type<Readable, Readable, unknown>(
    "Readable",
    (input: unknown): input is Readable => input instanceof Readable,
    // `t.success` and `t.failure` are helpers used to build `Either` instances
    (input, context) =>
        input instanceof Readable ? t.success(input) : t.failure(input, context, "Cannot parse into Readable"),
    // `A` and `O` are the same, so `encode` is just the identity function
    t.identity
);

export const UploadFileToStorageOptionsCodec: t.Type<UploadFileToStorageOptions> = t.intersection([
    t.type({
        contractDetails: ContractDetailsCodec,
        storageId: t.string,
        fileName: t.string,
        fileData: t.union([readableStream, buffer]),
    }),
    t.partial({
        path: t.string,
    }),
]);

const uploadFileToStorage = async (
    options: UploadFileToStorageOptions,
    sdkConfig: SDKConfiguration
): Promise<UploadFileToStorageResponse> => {
    if (!UploadFileToStorageOptionsCodec.is(options)) {
        throw new TypeValidationError(
            "Parameters failed validation. Props should be a plain object that contains contractDetails, storageId and fileName"
        );
    }
    try {
        const { contractDetails, storageId, path, fileData, fileName } = options;
        const { contractId, privateKey } = contractDetails;

        const formatedPath = addLeadingAndTrailingSlash(path);

        const file = Buffer.isBuffer(fileData) ? Readable.from(fileData) : fileData;

        const encryptStream = createEncryptStream(privateKey);

        const fullPath = `${formatedPath}${fileName}`;

        const response = await net.post(
            `${sdkConfig.cloudBaseUrl}clouds/${storageId}/files/apps/${sdkConfig.applicationId}${fullPath}`,
            {
                headers: {
                    contentType: "application/octet-stream",
                },
                responseType: "json",
                body: encryptStream(file),
                hooks: {
                    beforeRequest: [
                        (options) => {
                            const jwt: string = sign(
                                {
                                    sub: sdkConfig.applicationId,
                                    iss: contractId,
                                    aud: "cloud",
                                    iat: Math.floor(Date.now() / 1000),
                                    exp: Math.floor(Date.now() / 1000 + 60),
                                },
                                privateKey.toString(),
                                {
                                    algorithm: "PS512",
                                    keyid: `${contractId}_${sdkConfig.applicationId}_0`,
                                    header: {
                                        typ: "at+jwt",
                                        alg: "PS512",
                                        kid: `${contractId}_${sdkConfig.applicationId}_0`,
                                    },
                                }
                            );
                            options.headers["Authorization"] = `Bearer ${jwt}`;
                        },
                    ],
                },
            }
        );

        return {
            uploaded: true,
            statusCode: response.statusCode,
            statusMessage: response.statusMessage,
        };
    } catch (error) {
        handleServerResponse(error);
        throw error;
    }
};

// end uploadFileToStorage

export {
    createProvisionalStorage,
    listStorageFiles,
    downloadStorageFile,
    deleteStorageFiles,
    uploadFileToStorage,
    getUserStorage,
};
