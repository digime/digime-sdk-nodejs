/*!
 * Copyright (c) 2009-2018 digi.me Limited. All rights reserved.
 */

import { PartialAttemptOptions, retry } from "@lifeomic/attempt";
import { HTTPError } from "got";
import { decompress } from "iltorb";
import get from "lodash.get";
import isFunction from "lodash.isfunction";
import NodeRSA from "node-rsa";
import * as zlib from "zlib";
import { decryptData } from "./crypto";
import { ParameterValidationError, SDKInvalidError, SDKVersionInvalidError } from "./errors";
import { net } from "./net";
import { getPostboxURL, getPushCompletionURL, pushDataToPostbox, PushedFileMeta } from "./postbox";
import sdkVersion from "./sdk-version";
import { areOptionsValid, isPlainObject, isSessionValid, isValidString } from "./utils";

interface DigiMeSDKConfiguration {
    host: string;
    version: string;
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
    options: DigiMeSDKConfiguration,
    scope?: CAScope,
): Promise<Session> => {
    if (!isValidString(appId)) {
        throw new ParameterValidationError("Parameter appId should be a non empty string");
    }
    if (!isValidString(contractId)) {
        throw new ParameterValidationError("Parameter contractId should be a non empty string");
    }
    const url = `https://${options.host}/${options.version}/permission-access/session`;

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

const _getWebURL = (session: Session, callbackURL: string, options: DigiMeSDKConfiguration) => {
    if (!isSessionValid(session)) {
        throw new ParameterValidationError(
            // tslint:disable-next-line: max-line-length
            "Session should be an object that contains expiry as number, sessionKey and sessionExchangeToken property as string",
        );
    }
    if (!isValidString(callbackURL)) {
        throw new ParameterValidationError("Parameter callbackURL should be a non empty string");
    }
    // tslint:disable-next-line:max-line-length
    return `https://${options.host}/apps/quark/direct-onboarding?sessionExchangeToken=${session.sessionExchangeToken}&callbackUrl=${encodeURIComponent(callbackURL)}`;
};

const _getAppURL = (appId: string, session: Session, callbackURL: string) => {
    if (!isSessionValid(session)) {
        throw new ParameterValidationError(
            // tslint:disable-next-line: max-line-length
            "Session should be an object that contains expiry as number, sessionKey and sessionExchangeToken property as string",
        );
    }
    if (!isValidString(callbackURL)) {
        throw new ParameterValidationError("Parameter callbackURL should be string");
    }
    if (!isValidString(appId)) {
        throw new ParameterValidationError("Parameter appId should be a non empty string");
    }
    // tslint:disable-next-line:max-line-length
    return `digime://consent-access?sessionKey=${session.sessionKey}&callbackURL=${encodeURIComponent(callbackURL)}&appId=${appId}&sdkVersion=${sdkVersion}`;
};

const _getReceiptURL = (contractId: string, appId: string) => {
    if (!isValidString(contractId)) {
        throw new ParameterValidationError("Parameter contractId should be a non empty string");
    }
    if (!isValidString(appId)) {
        throw new ParameterValidationError("Parameter appId should be a non empty string");
    }
    return `digime://receipt?contractid=${contractId}&appid=${appId}`;
};

const _getFileList = async (sessionKey: string, options: DigiMeSDKConfiguration): Promise<string[]> => {
    const url = `https://${options.host}/${options.version}/permission-access/query/${sessionKey}`;
    const response = await net.get(url, { json: true });

    return response.body.fileList;
};

const _getFile = async (
    sessionKey: string,
    fileName: string,
    options: DigiMeSDKConfiguration,
): Promise<GetFileResponse> => {
    const url = `https://${options.host}/${options.version}/permission-access/query/${sessionKey}/${fileName}`;
    const response = await retry(async () => net.get(url, { json: true }), options.retryOptions);
    const { fileContent, fileMetadata, compression } = response.body;

    return {
        compression,
        fileContent,
        fileDescriptor: fileMetadata,
    };
};

const _getDataForSession = async (
    sessionKey: string,
    privateKey: NodeRSA.Key,
    onFileData: FileSuccessHandler,
    onFileError: FileErrorHandler,
    options: DigiMeSDKConfiguration,
): Promise<any> => {

    if (!isValidString(sessionKey)) {
        throw new ParameterValidationError("Parameter sessionKey should be a non empty string");
    }

    // Set up key
    const key: NodeRSA = new NodeRSA(privateKey, "pkcs1-private-pem");
    const fileList = await _getFileList(sessionKey, options);
    const filePromises = fileList.map((fileName) => {

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

    await Promise.all(filePromises);
    return;
};

const createSDK = (sdkOptions?: Partial<DigiMeSDKConfiguration>) => {

    if (sdkOptions !== undefined && !isPlainObject(sdkOptions)) {
        throw new ParameterValidationError("SDK options should be object that contains host and version properties");
    }

    const options: DigiMeSDKConfiguration = {
        host: "api.digi.me",
        version: "v1.0",
        retryOptions: {
            delay: 750,
            factor: 2,
            maxAttempts: 5,
        },
        ...sdkOptions,
    };

    if (!areOptionsValid(options)) {
        throw new ParameterValidationError(
            "SDK options should be object that contains host and version properties as string",
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
        getDataForSession: (
            sessionKey: string,
            privateKey: NodeRSA.Key,
            onFileData: FileSuccessHandler,
            onFileError: FileErrorHandler,
        ) => (
            _getDataForSession(sessionKey, privateKey, onFileData, onFileError, options)
        ),
        pushDataToPostbox: (
            sessionKey: string,
            postboxId: string,
            publicKey: string,
            pushedData: FileMeta<PushedFileMeta>,
        ) => (
            pushDataToPostbox(sessionKey, postboxId, publicKey, pushedData, options)
        ),
        getAppURL: (
            appId: string,
            session: Session,
            callbackURL: string,
        ) => (
            _getAppURL(appId, session, callbackURL)
        ),
        getReceiptURL: (
            contractId: string,
            appId: string,
        ) => (
            _getReceiptURL(contractId, appId)
        ),
        getPostboxURL: (
            appId: string,
            session: Session,
            callbackURL: string,
        ) => (
            getPostboxURL(appId, session, callbackURL)
        ),
        getWebURL: (
            session: Session,
            callbackURL: string,
        ) => (
            _getWebURL(session, callbackURL, options)
        ),
        getPushCompleteURL: (
            sessionKey: string,
            postboxId: string,
            callbackURL: string,
        ) => (
            getPushCompletionURL(sessionKey, postboxId, callbackURL)
        ),
    };
};

export {
    createSDK,
    isSessionValid,
    CAScope,
    FileMeta,
    FileSuccessResult,
    FileErrorResult,
    FileSuccessHandler,
    FileErrorHandler,
    Session,
    DigiMeSDKConfiguration,
};
