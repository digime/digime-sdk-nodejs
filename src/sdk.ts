/*!
 * Copyright (c) 2009-2018 digi.me Limited. All rights reserved.
 */

import { PartialAttemptOptions, retry, sleep } from "@lifeomic/attempt";
import { HTTPError } from "got";
import { decompress } from "iltorb";
import get from "lodash.get";
import isFunction from "lodash.isfunction";
import NodeRSA from "node-rsa";
import { URL } from "url";
import * as zlib from "zlib";
import { decryptData } from "./crypto";
import { ParameterValidationError, SDKInvalidError, SDKVersionInvalidError } from "./errors";
import { net } from "./net";
import { getCreatePostboxUrl, getPostboxImportUrl, pushDataToPostbox, PushedFileMeta } from "./postbox";
import sdkVersion from "./sdk-version";
import {
    isConfigurationValid, isPlainObject, isSessionValid, isValidString,
} from "./utils";
import { GetFileListResponse, LibrarySyncStatus } from "./api-responses";

interface DMESDKConfiguration {
    baseUrl: string;
    retryOptions?: PartialAttemptOptions<any>;
}

interface Session {
    expiry: number;
    sessionKey: string;
    sessionExchangeToken: string;
}

interface FileMeta<T = FileDescriptor> {
    fileData: any;
    fileName: string;
    fileDescriptor: T;
}

interface CAScope {
    timeRanges?: TimeRange[];
}

interface TimeRange {
    from?: number;
    last?: string;
    to?: number;
}

interface GetFileResponse {
    fileContent: string;
    fileDescriptor: FileDescriptor;
    compression?: string;
}

interface FileDescriptor {
    objectCount: number;
    objectType: string;
    serviceGroup: string;
    serviceName: string;
    mimetype?: string;
}

type FileSuccessResult = { data: any } & FileMeta;
type FileErrorResult = { error: Error } & FileMeta;
type FileSuccessHandler = (response: FileSuccessResult) => void;
type FileErrorHandler = (response: FileErrorResult) => void;

const _establishSession = async (
    appId: string,
    contractId: string,
    options: DMESDKConfiguration,
    scope?: CAScope,
): Promise<Session> => {
    if (!isValidString(appId)) {
        throw new ParameterValidationError("Parameter appId should be a non empty string");
    }
    if (!isValidString(contractId)) {
        throw new ParameterValidationError("Parameter contractId should be a non empty string");
    }
    const url = `${options.baseUrl}/permission-access/session`;

    const sdkAgent = {
        name: "js",
        version: sdkVersion,
        meta: {
            node: process.version,
        },
    };
    try {

        const response = await net.post(url, {
            json: true,
            body: {
                appId,
                contractId,
                scope,
                sdkAgent,
                accept: {
                    compression: "gzip",
                },
            },
        });

        // TODO: Session validation
        return response.body;

    } catch (error) {

        if (!(error instanceof HTTPError)) {
            throw error;
        }

        const errorCode = get(error, "body.error.code");

        if (errorCode === "SDKInvalid") {
            throw new SDKInvalidError(get(error, "body.error.message"));
        }

        if (errorCode === "SDKVersionInvalid") {
            throw new SDKVersionInvalidError(get(error, "body.error.message"));
        }

        throw error;
    }
};

const _getGuestAuthorizeUrl = (session: Session, callbackUrl: string, options: DMESDKConfiguration) => {
    if (!isSessionValid(session)) {
        throw new ParameterValidationError(
            // tslint:disable-next-line: max-line-length
            "Session should be an object that contains expiry as number, sessionKey and sessionExchangeToken property as string",
        );
    }
    if (!isValidString(callbackUrl)) {
        throw new ParameterValidationError("Parameter callbackUrl should be a non empty string");
    }
    // tslint:disable-next-line:max-line-length
    return `${new URL(options.baseUrl).origin}/apps/quark/direct-onboarding?sessionExchangeToken=${session.sessionExchangeToken}&callbackUrl=${encodeURIComponent(callbackUrl)}`;
};

const _getAuthorizeUrl = (appId: string, session: Session, callbackUrl: string) => {
    if (!isSessionValid(session)) {
        throw new ParameterValidationError(
            // tslint:disable-next-line: max-line-length
            "Session should be an object that contains expiry as number, sessionKey and sessionExchangeToken property as string",
        );
    }
    if (!isValidString(callbackUrl)) {
        throw new ParameterValidationError("Parameter callbackUrl should be string");
    }
    if (!isValidString(appId)) {
        throw new ParameterValidationError("Parameter appId should be a non empty string");
    }
    // tslint:disable-next-line:max-line-length
    return `digime://consent-access?sessionKey=${session.sessionKey}&callbackUrl=${encodeURIComponent(callbackUrl)}&appId=${appId}&sdkVersion=${sdkVersion}&resultVersion=2`;
};

const _getReceiptUrl = (contractId: string, appId: string) => {
    if (!isValidString(contractId)) {
        throw new ParameterValidationError("Parameter contractId should be a non empty string");
    }
    if (!isValidString(appId)) {
        throw new ParameterValidationError("Parameter appId should be a non empty string");
    }
    return `digime://receipt?contractId=${contractId}&appId=${appId}`;
};

const _getFileList = async (sessionKey: string, options: DMESDKConfiguration): Promise<GetFileListResponse> => {
    const url = `${options.baseUrl}/permission-access/query/${sessionKey}`;
    const response = await net.get(url, { json: true });

    return response.body;
};

const _getFile = async (
    sessionKey: string,
    fileName: string,
    options: DMESDKConfiguration,
): Promise<GetFileResponse> => {
    const url = `${options.baseUrl}/permission-access/query/${sessionKey}/${fileName}`;
    const response = await retry(async () => net.get(url, { json: true }), options.retryOptions);
    const { fileContent, fileMetadata, compression } = response.body;

    return {
        compression,
        fileContent,
        fileDescriptor: fileMetadata,
    };
};

const _getSessionData = async (
    sessionKey: string,
    privateKey: NodeRSA.Key,
    onFileData: FileSuccessHandler,
    onFileError: FileErrorHandler,
    options: DMESDKConfiguration,
): Promise<any> => {

    if (!isValidString(sessionKey)) {
        throw new ParameterValidationError("Parameter sessionKey should be a non empty string");
    }

    // Set up key
    const key: NodeRSA = new NodeRSA(privateKey, "pkcs1-private-pem");
    let state: LibrarySyncStatus = "pending";
    let filePromises: Promise<any>[] = [];
    let handledFiles: {name: string, updated: number}[] = [];

    while ( state !== "partial" && state !== "completed" ) {
        const {status, fileList}: GetFileListResponse = await _getFileList(sessionKey, options);
        state = status.state;

        const newFiles = fileList.filter(({name}) => handledFiles.map(({name}) => name).indexOf(name) === -1);
        handledFiles = handledFiles.concat(...newFiles);
        
        filePromises = newFiles.map(({name: fileName}) => {
            return _getFile(sessionKey, fileName, options).then(async (response: GetFileResponse) => {
                const { compression, fileContent, fileDescriptor } = response;
                const { mimetype } = fileDescriptor;
                let data: Buffer = decryptData(key, fileContent);
    
                if (compression === "brotli") {
                    data = await decompress(data);
                } else if (compression === "gzip") {
                    data = zlib.gunzipSync(data);
                }
    
                let fileData: any = data;
                if (!mimetype) {
                    fileData = JSON.parse(data.toString("utf8"));
                } else {
                    fileData = data.toString("base64");
                }
    
                if (isFunction(onFileData)) {
                    onFileData({
                        fileData,
                        fileDescriptor,
                        fileName,
                        fileList,
                    });
                }
                return;
            }).catch((error) => {
                // Failed all attempts
                if (isFunction(onFileError)) {
                    onFileError({
                        error,
                        fileName,
                        fileList,
                    });
                }
                return;
            });
        });

        await sleep(3000);
    }

    await Promise.all(filePromises);
    return;
};

const _getSessionAccounts = async (
    sessionKey: string,
    options: DMESDKConfiguration,
) => {
    try {
        if (!isValidString(sessionKey)) {
            throw new ParameterValidationError("Parameter sessionKey should be a non empty string");
        }

        const response = await net.get(
            `${options.baseUrl}/permission-access/query/${sessionKey}/accounts.json`,
            { json: true },
        );

        const { fileContent } = response.body;

        return {
            accounts: fileContent.accounts,
        };
    } catch (error) {

        if (!(error instanceof HTTPError)) {
            throw error;
        }

        const errorCode = get(error, "body.error.code");

        if (errorCode === "SDKInvalid") {
            throw new SDKInvalidError(get(error, "body.error.message"));
        }

        if (errorCode === "SDKVersionInvalid") {
            throw new SDKVersionInvalidError(get(error, "body.error.message"));
        }

        throw error;
    }
};

const init = (sdkOptions?: Partial<DMESDKConfiguration>) => {

    if (sdkOptions !== undefined && !isPlainObject(sdkOptions)) {
        throw new ParameterValidationError("SDK options should be object that contains host and version properties");
    }

    const options: DMESDKConfiguration = {
        baseUrl: "https://api.digi.me/v1.1",
        retryOptions: {
            delay: 750,
            factor: 2,
            maxAttempts: 5,
        },
        ...sdkOptions,
    };

    if (!isConfigurationValid(options)) {
        throw new ParameterValidationError(
            "SDK options should be object that contains baseUrl property as string",
        );
    }

    return {
        establishSession: (
            appId: string,
            contractId: string,
            scope?: CAScope,
        ) => (
            _establishSession(appId, contractId, options, scope)
        ),
        getSessionData: (
            sessionKey: string,
            privateKey: NodeRSA.Key,
            onFileData: FileSuccessHandler,
            onFileError: FileErrorHandler,
        ) => (
            _getSessionData(sessionKey, privateKey, onFileData, onFileError, options)
        ),
        getSessionAccounts: (
            sessionKey: string,
        ) => (
            _getSessionAccounts(sessionKey, options)
        ),
        pushDataToPostbox: (
            sessionKey: string,
            postboxId: string,
            publicKey: string,
            pushedData: FileMeta<PushedFileMeta>,
        ) => (
            pushDataToPostbox(sessionKey, postboxId, publicKey, pushedData, options)
        ),
        getAuthorizeUrl: (
            appId: string,
            session: Session,
            callbackUrl: string,
        ) => (
            _getAuthorizeUrl(appId, session, callbackUrl)
        ),
        getGuestAuthorizeUrl: (
            session: Session,
            callbackUrl: string,
        ) => (
            _getGuestAuthorizeUrl(session, callbackUrl, options)
        ),
        getReceiptUrl: (
            contractId: string,
            appId: string,
        ) => (
            _getReceiptUrl(contractId, appId)
        ),
        getCreatePostboxUrl: (
            appId: string,
            session: Session,
            callbackUrl: string,
        ) => (
            getCreatePostboxUrl(appId, session, callbackUrl)
        ),
        getPostboxImportUrl: () => getPostboxImportUrl(),
    };
};

export {
    init,
    isSessionValid,
    CAScope,
    FileMeta,
    FileSuccessResult,
    FileErrorResult,
    FileSuccessHandler,
    FileErrorHandler,
    Session,
    DMESDKConfiguration,
};
