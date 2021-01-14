/*!
 * Copyright (c) 2009-2020 digi.me Limited. All rights reserved.
 */

import { Response } from "got";
import get from "lodash.get";
import isFunction from "lodash.isfunction";
import NodeRSA from "node-rsa";
import { URL } from "url";
import * as zlib from "zlib";
import { decryptData } from "./crypto";
import { authorizeOngoingAccess, exchangeCodeForToken } from "./cyclic-ca";
import { TypeValidationError } from "./errors";
import { net, handleInvalidatedSdkResponse } from "./net";
import { getAuthorizeUrl } from "./paths";
import { getCreatePostboxUrl, getPostboxImportUrl, pushDataToPostbox, PushedFileMeta } from "./postbox";
import sdkVersion from "./sdk-version";
import type {
    CAScope,
    FileMeta,
    GetSessionDataResponse,
    OngoingAccessAuthorization,
    OngoingAccessConfiguration,
} from "./types";
import { isPlainObject, isValidString } from "./utils";
import { assertIsSession, Session } from "./types/api/session";
import { sleep } from "./sleep";
import { DMESDKConfiguration, assertIsDMESDKConfiguration } from "./types/dme-sdk-configuration";
import { CAFileListResponse, assertIsCAFileListResponse } from "./types/api/ca-file-list-response";
import { assertIsCAFileResponse, CAFileResponse, isRawFileMetadata } from "./types/api/ca-file-response";
import isString from "lodash.isstring";
import { assertIsCAAccountsResponse, CAAccountsResponse } from "./types/api/ca-accounts-response";

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
        throw new TypeValidationError("Parameter appId should be a non empty string");
    }
    if (!isValidString(contractId)) {
        throw new TypeValidationError("Parameter contractId should be a non empty string");
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

        const { body, headers } = await net.post(url, {
            json: {
                appId,
                contractId,
                scope,
                sdkAgent,
                accept: {
                    compression: "gzip",
                },
            },
            responseType: "json",
            retry: options.retryOptions,
        });

        if (headers["x-digi-sdk-status"]) {
            // tslint:disable-next-line:no-console max-line-length
            console.warn(`[digime-js-sdk@${sdkVersion}][${headers["x-digi-sdk-status"]}] ${headers["x-digi-sdk-status-message"]}`);
        }

        assertIsSession(body);

        return body;

    } catch (error) {

        handleInvalidatedSdkResponse(error);

        throw error;
    }
};

const _getGuestAuthorizeUrl = (session: Session, callbackUrl: string, options: DMESDKConfiguration) => {

    assertIsSession(session);

    if (!isValidString(callbackUrl)) {
        throw new TypeValidationError("Parameter callbackUrl should be a non empty string");
    }
    // tslint:disable-next-line:max-line-length
    return `${new URL(options.baseUrl).origin}/apps/quark/v1/direct-onboarding?sessionExchangeToken=${session.sessionExchangeToken}&callbackUrl=${encodeURIComponent(callbackUrl)}`;
};

const _getReceiptUrl = (contractId: string, appId: string) => {
    if (!isValidString(contractId)) {
        throw new TypeValidationError("Parameter contractId should be a non empty string");
    }
    if (!isValidString(appId)) {
        throw new TypeValidationError("Parameter appId should be a non empty string");
    }
    return `digime://receipt?contractId=${contractId}&appId=${appId}`;
};

const _getFileList = async (sessionKey: string, options: DMESDKConfiguration): Promise<CAFileListResponse> => {
    const url = `${options.baseUrl}/permission-access/query/${sessionKey}`;
    const response = await net.get(url, {
        responseType: "json",
        retry: options.retryOptions,
    });

    assertIsCAFileListResponse(response.body);

    return response.body;
};

const _getFile = async (
    sessionKey: string,
    fileName: string,
    privateKey: NodeRSA.Key,
    options: DMESDKConfiguration,
): Promise<FileMeta> => {
    const response = await _fetchFile(sessionKey, fileName, options);
    const { compression, fileContent, fileMetadata } = response;
    const key: NodeRSA = new NodeRSA(privateKey, "pkcs1-private-pem");
    let data: Buffer = decryptData(key, fileContent);

    if (compression === "brotli") {
        data = zlib.brotliDecompressSync(data);
    } else if (compression === "gzip") {
        data = zlib.gunzipSync(data);
    }

    let fileData: any = data;
    if (isRawFileMetadata(fileMetadata) && fileMetadata.mimetype) {
        fileData = data.toString("base64");
    } else {
        fileData = JSON.parse(data.toString("utf8"));
    }

    return {
        fileData,
        fileMetadata,
        fileName,
    };
};

const _fetchFile = async (
    sessionKey: string,
    fileName: string,
    options: DMESDKConfiguration,
): Promise<CAFileResponse> => {
    const url = `${options.baseUrl}/permission-access/query/${sessionKey}/${fileName}`;
    const response = await net.get(url, {
        responseType: "json",
        retry: options.retryOptions,
    });

    assertIsCAFileResponse(response.body);

    const { fileContent, fileMetadata, compression } = response.body;

    return {
        compression,
        fileContent,
        fileMetadata,
    };
};

const _getSessionData = (
    sessionKey: string,
    privateKey: NodeRSA.Key,
    onFileData: FileSuccessHandler,
    onFileError: FileErrorHandler,
    options: DMESDKConfiguration,
): GetSessionDataResponse => {

    if (!isValidString(sessionKey)) {
        throw new TypeValidationError("Parameter sessionKey should be a non empty string");
    }

    let allowPollingToContinue: boolean = true;

    const allFilesPromise: Promise<unknown> = new Promise(async (resolve) => {
        const filePromises: Array<Promise<unknown>> = [];
        const handledFiles: { [name: string]: number } = {};
        let state: CAFileListResponse["status"]["state"] = "pending";

        while (allowPollingToContinue && state !== "partial" && state !== "completed") {
            const { status, fileList }: CAFileListResponse = await _getFileList(sessionKey, options);
            state = status.state;

            if (state === "pending") {
                await sleep(3000);
                continue;
            }

            const newFiles: string[] = (fileList || []).reduce((accumulator: string[], file) => {
                const { name, updatedDate } = file;

                if (get(handledFiles, name, 0) < updatedDate) {
                    accumulator.push(name);
                    handledFiles[name] = updatedDate;
                }

                return accumulator;
            }, []);

            const newPromises = newFiles.map((fileName: string) => {
                return _getFile(sessionKey, fileName, privateKey, options).then((fileMeta) => {

                    if (isFunction(onFileData)) {
                        onFileData({...fileMeta, fileList});
                    }
                    return;
                }).catch((error) => {
                    // Failed all attempts
                    if (isFunction(onFileError)) {
                        onFileError({ error, fileName, fileList });
                    }
                    return;
                });
            });

            filePromises.push(...newPromises);

            if (state === "running") {
                await sleep(3000);
            }
        }

        Promise.all(filePromises).then(() => {
            resolve();
        });
    });

    return ({
        stopPolling: () => {
            allowPollingToContinue = false;
        },
        filePromise: allFilesPromise,
    });
};

const _getSessionAccounts = async (
    sessionKey: string,
    privateKey: NodeRSA.Key,
    options: DMESDKConfiguration,
): Promise<Pick<CAAccountsResponse, "accounts">> => {

    if (!isValidString(sessionKey)) {
        throw new TypeValidationError("Parameter sessionKey should be a non empty string");
    }

    let response: Response<unknown>;

    try {
        response = await net.get(`${options.baseUrl}/permission-access/query/${sessionKey}/accounts.json`, {
            responseType: "json",
            retry: options.retryOptions,
        });
    } catch (error) {

        handleInvalidatedSdkResponse(error);

        throw error;
    }

    if (!isPlainObject(response.body) || !isString(response.body.fileContent)){
        throw new TypeValidationError("API returned an unexpected response");
    }

    const { fileContent } = response.body;

    const key = new NodeRSA(privateKey, "pkcs1-private-pem");
    const decryptedData = decryptData(key, fileContent).toString("utf8");

    let parsedData: unknown;

    try {
        parsedData = JSON.parse(decryptedData);
    } catch(error) {
        if (error instanceof SyntaxError) {
            throw new SyntaxError(`API returned malformed JSON data - ${error.message}`);
        }
        throw error;
    }

    assertIsCAAccountsResponse(parsedData);

    return {
        accounts: parsedData.accounts,
    };
};

const init = (sdkOptions?: Partial<DMESDKConfiguration>) => {

    if (sdkOptions !== undefined && !isPlainObject(sdkOptions)) {
        throw new TypeValidationError("SDK options should be object that contains host and version properties");
    }

    const options: DMESDKConfiguration = {
        baseUrl: "https://api.digi.me/v1.4",
        retryOptions: {
            retries: 5,
        },
        ...sdkOptions,
    };

    assertIsDMESDKConfiguration(options);

    return {
        getFile: (
            sessionKey: string,
            fileName: string,
            privateKey: NodeRSA.Key,
        ) => (
                _getFile(sessionKey, fileName, privateKey, options)
            ),
        getFileList: (
            sessionKey: string,
        ) => (
                _getFileList(sessionKey, options)
            ),
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
        exchangeCodeForToken: (
            details: OngoingAccessConfiguration,
            authorizationCode: string,
            codeVerifier?: string,
        ) => (
                exchangeCodeForToken(details, authorizationCode, codeVerifier, options)
            ),
        getSessionAccounts: (
            sessionKey: string,
            privateKey: NodeRSA.Key,
        ) => (
                _getSessionAccounts(sessionKey, privateKey, options)
            ),
        pushDataToPostbox: (
            sessionKey: string,
            postboxId: string,
            publicKey: string,
            pushedData: PushedFileMeta,
        ) => (
                pushDataToPostbox(sessionKey, postboxId, publicKey, pushedData, options)
            ),
        getAuthorizeUrl: (
            appId: string,
            session: Session,
            callbackUrl?: string,
        ) => (
                getAuthorizeUrl(appId, session, callbackUrl)
            ),
        authorizeOngoingAccess: (
            details: OngoingAccessAuthorization,
            session: Session,
        ) => (
                authorizeOngoingAccess(details, session, options)
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
    CAScope,
    FileMeta,
    FileSuccessResult,
    FileErrorResult,
    FileSuccessHandler,
    FileErrorHandler,
    Session,
    DMESDKConfiguration,
};
