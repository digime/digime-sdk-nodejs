/*!
 * Copyright (c) 2009-2018 digi.me Limited. All rights reserved.
 */

import { PartialAttemptOptions, retry } from "@lifeomic/attempt";
import { decompress } from "iltorb";
import isFunction from "lodash.isfunction";
import isInteger from "lodash.isinteger";
import isPlainObject from "lodash.isplainobject";
import isString from "lodash.isstring";
import NodeRSA from "node-rsa";
import { decryptData } from "./crypto";
import { net } from "./net";
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

interface FileMeta {
    fileData: any;
    fileName: string;
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
    compression?: string;
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
    if (!isString(appId)) {
        throw new Error("Parameter appId should be string");
    }
    if (!isString(contractId)) {
        throw new Error("Parameter contractId should be string");
    }
    const url = `https://${options.host}/${options.version}/permission-access/session`;

    const response = await net.post(url, {
        json: true,
        body: {
            appId,
            contractId,
            scope,
            accept: {
                compression: "brotli",
            },
        },
    });

    return response.body;
};

const _getWebURL = (session: Session, callbackURL: string, options: DigiMeSDKConfiguration) => {
    if (!_isSessionValid(session)) {
        throw new Error("Session should be an object that contains expiry as number and sessionKey property as string");
    }
    if (!isString(callbackURL)) {
        throw new Error("Parameter callbackURL should be string");
    }
    // tslint:disable-next-line:max-line-length
    return `https://${options.host}/apps/quark/direct-onboarding?sessionKey=${session.sessionKey}&callbackUrl=${encodeURIComponent(callbackURL)}`;
};

const _getAppURL = (appId: string, session: Session, callbackURL: string) => {
    if (!_isSessionValid(session)) {
        throw new Error("Session should be an object that contains expiry as number and sessionKey property as string");
    }
    if (!isString(callbackURL)) {
        throw new Error("Parameter callbackURL should be string");
    }
    if (!isString(appId)) {
        throw new Error("Parameter appId should be string");
    }
    // tslint:disable-next-line:max-line-length
    return `digime://consent-access?sessionKey=${session.sessionKey}&callbackURL=${encodeURIComponent(callbackURL)}&appId=${appId}&sdkVersion=${sdkVersion}`;
};

const _getFileList = async (sessionKey: string, options: DigiMeSDKConfiguration): Promise<string[]> => {
    const url = `https://${options.host}/${options.version}/permission-access/query/${sessionKey}`;
    const response = await net.get(url, {json: true});

    return response.body.fileList;
};

const _getFile = async (
    sessionKey: string,
    fileName: string,
    options: DigiMeSDKConfiguration,
): Promise<IGetFileResponse> => {
    const url = `https://${options.host}/${options.version}/permission-access/query/${sessionKey}/${fileName}`;
    const response = await retry(async () => net.get(url, {json: true}), options.retryOptions);
    const {fileContent, compression} = response.body;

    return {
        compression,
        fileContent,
    };
};

const _getDataForSession = async (
    sessionKey: string,
    privateKey: NodeRSA.Key,
    onFileData: FileSuccessHandler,
    onFileError: FileErrorHandler,
    options: DigiMeSDKConfiguration,
): Promise<any> => {

    if (!isString(sessionKey)) {
        throw new Error("Parameter sessionKey should be string");
    }

    // Set up key
    const key: NodeRSA = new NodeRSA(
        privateKey,
        "pkcs1-private-pem",
    );

    const fileList = await _getFileList(sessionKey, options);
    const filePromises = fileList.map((fileName) => {

        return _getFile(sessionKey, fileName, options).then(async (fileData: IGetFileResponse) => {
            const {compression, fileContent} = fileData;
            let data: Buffer = decryptData(key, fileContent);

            if (compression === "brotli") {
                data = await decompress(data);
            }

            data = JSON.parse(data.toString("utf8"));

            if (isFunction(onFileData)) {
                onFileData({
                    fileData: data,
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

const _isSessionValid = (session: unknown): session is Session => (
    _isPlainObject(session) && isInteger(session.expiry) && isString(session.sessionKey)
);

const _areOptionsValid = (options: unknown): options is DigiMeSDKConfiguration => (
    _isPlainObject(options) && isString(options.host) && isString(options.version)
);

const _isPlainObject = (o: unknown): o is { [key: string]: unknown } => isPlainObject(o);

const createSDK = (sdkOptions?: Partial<DigiMeSDKConfiguration>) => {

    if (sdkOptions !== undefined && !_isPlainObject(sdkOptions)) {
        throw new Error("SDK options should be object that contains host and version properties");
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
        throw new Error("SDK options should be object that contains host and version properties as string");
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
        getWebURL: (session: Session, callbackURL: string) => _getWebURL(session, callbackURL, options),
        getAppURL:  (appId: string, session: Session, callbackURL: string) => _getAppURL(appId, session, callbackURL),
    };
};

export {
    createSDK,
    CAScope,
    FileMeta,
    FileSuccessResult,
    FileErrorResult,
    FileSuccessHandler,
    FileErrorHandler,
    Session,
    DigiMeSDKConfiguration,
};
