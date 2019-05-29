/*!
 * Copyright (c) 2009-2018 digi.me Limited. All rights reserved.
 */

import { PartialAttemptOptions, retry } from "@lifeomic/attempt";
import { HTTPError } from "got";
import { decompress } from "iltorb";
import get from "lodash.get";
import isFunction from "lodash.isfunction";
import isInteger from "lodash.isinteger";
import isPlainObject from "lodash.isplainobject";
import isString from "lodash.isstring";
import NodeRSA from "node-rsa";
import * as zlib from "zlib";
import { decryptData } from "./crypto";
import { ParameterValidationError, SDKInvalidError, SDKVersionInvalidError } from "./errors";
import { net } from "./net";
import { getCompletionURL, getCreationURL, IPushedFileMeta, pushToPostbox } from "./postbox";
import sdkVersion from "./sdk-version";

interface DigiMeSDKConfiguration {
    host: string;
    version: string;
    retryOptions?: PartialAttemptOptions<any>;
}

interface Session {
    expiry: number;
    sessionKey: string;
}

interface IFileMeta<T = IFileDescriptor> {
    fileData: any;
    fileName: string;
    fileDescriptor: T;
}

interface CAScope {
    timeRanges?: ITimeRange[];
}

interface ITimeRange {
    from?: number;
    last?: string;
    to?: number;
}

interface IGetFileResponse {
    fileContent: string;
    fileDescriptor: IFileDescriptor;
    compression?: string;
}

interface IFileDescriptor {
    objectCount: number;
    objectType: string;
    serviceGroup: string;
    serviceName: string;
    mimetype?: string;
}

type FileSuccessResult = { data: any } & IFileMeta;
type FileErrorResult = { error: Error } & IFileMeta;
type FileSuccessHandler = (response: FileSuccessResult) => void;
type FileErrorHandler = (response: FileErrorResult) => void;

const _establishSession = async (
    appId: string,
    contractId: string,
    options: DigiMeSDKConfiguration,
    scope?: CAScope,
): Promise<Session> => {
    if (!_isValidString(appId)) {
        throw new ParameterValidationError("Parameter appId should be a non empty string");
    }
    if (!_isValidString(contractId)) {
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
            "Session should be an object that contains expiry as number and sessionKey property as string",
        );
    }
    if (!_isValidString(callbackURL)) {
        throw new ParameterValidationError("Parameter callbackURL should be a non empty string");
    }
    // tslint:disable-next-line:max-line-length
    return `https://${options.host}/apps/quark/direct-onboarding?sessionKey=${session.sessionKey}&callbackUrl=${encodeURIComponent(callbackURL)}`;
};

const _getAppURL = (appId: string, session: Session, callbackURL: string) => {
    if (!isSessionValid(session)) {
        throw new ParameterValidationError(
            "Session should be an object that contains expiry as number and sessionKey property as string",
        );
    }
    if (!_isValidString(callbackURL)) {
        throw new ParameterValidationError("Parameter callbackURL should be string");
    }
    if (!_isValidString(appId)) {
        throw new ParameterValidationError("Parameter appId should be a non empty string");
    }
    // tslint:disable-next-line:max-line-length
    return `digime://consent-access?sessionKey=${session.sessionKey}&callbackURL=${encodeURIComponent(callbackURL)}&appId=${appId}&sdkVersion=${sdkVersion}`;
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
): Promise<IGetFileResponse> => {
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

    if (!_isValidString(sessionKey)) {
        throw new ParameterValidationError("Parameter sessionKey should be a non empty string");
    }

    // Set up key
    const key: NodeRSA = new NodeRSA(privateKey, "pkcs1-private-pem");
    const fileList = await _getFileList(sessionKey, options);
    const filePromises = fileList.map((fileName) => {

        return _getFile(sessionKey, fileName, options).then(async (response: IGetFileResponse) => {
            const { compression, fileContent, fileDescriptor } = response;
            const { mimetype } = fileDescriptor;
            let data: Buffer = decryptData(key, fileContent);

            if (compression === "brotli") {
                data = await decompress(data);
            } else if (compression === "gzip") {
                data = zlib.gunzipSync(data);
            }

            let fileData: any = data;
            if (!mimetype || mimetype === "application/json") {
                fileData = JSON.parse(data.toString("utf8"));
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

const isSessionValid = (session: unknown): session is Session => (
    _isPlainObject(session) && isInteger(session.expiry) && isString(session.sessionKey)
);

const _areOptionsValid = (options: unknown): options is DigiMeSDKConfiguration => (
    _isPlainObject(options) && isString(options.host) && isString(options.version)
);

const _isPlainObject = (o: unknown): o is { [key: string]: unknown } => isPlainObject(o);

const _isValidString = (o: unknown): o is string => isString(o) && o.length > 0;

const createSDK = (sdkOptions?: Partial<DigiMeSDKConfiguration>) => {

    if (sdkOptions !== undefined && !_isPlainObject(sdkOptions)) {
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

    if (!_areOptionsValid(options)) {
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
            pushedData: IFileMeta<IPushedFileMeta>,
        ) => (
                pushToPostbox(sessionKey, postboxId, publicKey, pushedData, options)
            ),
        getAppURL: (
            appId: string,
            session: Session,
            callbackURL: string,
        ) => (
                _getAppURL(appId, session, callbackURL)
            ),
        getPostboxURL: (
            appId: string,
            session: Session,
            callbackURL: string,
        ) => (
                getCreationURL(appId, session, callbackURL)
            ),
        getWebURL: (
            session: Session,
            callbackURL: string,
        ) => (
                _getWebURL(session, callbackURL, options)
            ),
        getPushCompleteURL: (
            sessionId: string,
            postboxId: string,
            callbackURL: string,
        ) => (
                getCompletionURL(sessionId, postboxId, callbackURL)
            ),
    };
};

export {
    createSDK,
    isSessionValid,
    CAScope,
    IFileMeta,
    FileSuccessResult,
    FileErrorResult,
    FileSuccessHandler,
    FileErrorHandler,
    Session,
    DigiMeSDKConfiguration,
};
