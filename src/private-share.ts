/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import { TypeValidationError, DigiMeSDKError } from "./errors";
import { GetAuthorizationUrlResponse, GetFileListOptions, GetFileOptions, GetSessionDataOptions, GetSessionDataResponse, PrepareFilesUsingAccessTokenOptions, UserAccessToken, UserDataAccessOptions, UserLibraryAccessResponse, ExchangeAccessTokenForReferenceOptions, SaasOptions, ExchangeCodeResponse} from "./types";
import { isNonEmptyString } from "./utils";
import { URL, URLSearchParams } from "url";
import { authorize, getVerifiedJWTPayload, refreshToken } from "./authorisation";
import { handleInvalidatedSdkResponse, net } from "./net";
import { sign } from "jsonwebtoken";
import { decryptData, getRandomAlphaNumeric } from "./crypto";
import { FileMeta, InternalProps, Session } from "./sdk";
import { assertIsCAFileListResponse, CAFileListResponse } from "./types/api/ca-file-list-response";
import { CAAccountsResponse } from "./types/api/ca-accounts-response";
import { Response } from "got/dist/source";
import NodeRSA from "node-rsa";
import get from "lodash.get";
import isFunction from "lodash.isfunction";
import { sleep } from "./sleep";
import { isDecodedCAFileHeaderResponse, MappedFileMetadata, RawFileMetadata } from "./types/api/ca-file-response";
import * as zlib from "zlib";
import base64url from "base64url";
import { assertIsSession } from "./types/api/session";

const prepareFilesUsingAccessToken = async ({
    applicationId,
    contractId,
    redirectUri,
    privateKey,
    userAccessToken,
    sdkOptions,
}: PrepareFilesUsingAccessTokenOptions & InternalProps): Promise<UserLibraryAccessResponse> => {

    let session: Session;

    // 1. We have an access token, try and trigger a data request
    try {
        session = await triggerDataQuery({
            applicationId,
            contractId,
            redirectUri,
            privateKey,
            accessToken: userAccessToken.accessToken,
            sdkOptions,
        });
        return { session };
    } catch (error) { /* Invalid tokens */ }

    const newTokens: UserAccessToken = await refreshToken({
        applicationId,
        contractId,
        redirectUri,
        privateKey,
        userAccessToken,
        sdkOptions,
    });

    session = await triggerDataQuery({
        applicationId,
        contractId,
        redirectUri,
        privateKey,
        accessToken: newTokens.accessToken,
        sdkOptions,
    });

    return {
        session,
        updatedAccessToken: newTokens,
    };
};

interface TriggerDataQueryProps extends Omit<PrepareFilesUsingAccessTokenOptions, "userAccessToken"> {
    accessToken: string,
}

const triggerDataQuery = async ({
    applicationId,
    contractId,
    redirectUri,
    privateKey,
    accessToken,
    sdkOptions,
}: TriggerDataQueryProps & InternalProps): Promise<Session> => {
    const jwt: string = sign(
        {
            access_token: accessToken,
            client_id: `${applicationId}_${contractId}`,
            nonce: getRandomAlphaNumeric(32),
            redirect_uri: redirectUri,
            timestamp: new Date().getTime(),
        },
        privateKey.toString(),
        {
            algorithm: "PS512",
            noTimestamp: true,
        },
    );

    const url = `${sdkOptions.baseUrl}/permission-access/trigger`;

    const response = await net.post(url, {
        headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json", // NOTE: we might not need this
        },
        responseType: "json",
    });

    const session: unknown = get(response, "body.session");
    assertIsSession(session);

    return session;
};

const getFileList = async ({
    sessionKey,
    sdkOptions,
}: GetFileListOptions & InternalProps): Promise<CAFileListResponse> => {
    const url = `${sdkOptions.baseUrl}/permission-access/query/${sessionKey}`;
    const response = await net.get(url, {
        responseType: "json",
        retry: sdkOptions.retryOptions,
    });

    assertIsCAFileListResponse(response.body);

    return response.body;
};

const getFile = async ({
    sessionKey,
    fileName,
    privateKey,
    sdkOptions,
}: GetFileOptions & InternalProps ): Promise<FileMeta> => {

    if (!isNonEmptyString(sessionKey)) {
        throw new TypeValidationError("Parameter sessionKey should be a non empty string");
    }

    const response = await fetchFile({sessionKey, fileName, sdkOptions});
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

const fetchFile = async ({
    sessionKey,
    fileName,
    sdkOptions,
}: FetchFileProps & InternalProps): Promise<FetchFileResponse> => {

    let response: Response<unknown>;

    try {
        response = await net.get(`${sdkOptions.baseUrl}/permission-access/query/${sessionKey}/${fileName}`, {
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

const getSessionData = ({
    sessionKey,
    privateKey,
    onFileData,
    onFileError,
    sdkOptions,
}: GetSessionDataOptions & InternalProps ): GetSessionDataResponse => {

    if (!isNonEmptyString(sessionKey)) {
        throw new TypeValidationError("Parameter sessionKey should be a non empty string");
    }

    let allowPollingToContinue: boolean = true;

    const allFilesPromise: Promise<void> = new Promise(async (resolve) => {
        const filePromises: Array<Promise<unknown>> = [];
        const handledFiles: { [name: string]: number } = {};
        let state: CAFileListResponse["status"]["state"] = "pending";

        while (allowPollingToContinue && state !== "partial" && state !== "completed") {
            const { status, fileList }: CAFileListResponse = await getFileList({sessionKey, sdkOptions});
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
                return getFile({sessionKey, fileName, privateKey, sdkOptions}).then((fileMeta) => {

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

const getSessionAccounts = async ({
    sessionKey,
    privateKey,
    sdkOptions,
}: UserDataAccessOptions & InternalProps): Promise<Pick<CAAccountsResponse, "accounts">> => {

    const {fileData} = await getFile({
        sessionKey,
        fileName: "accounts.json",
        privateKey,
        sdkOptions,
    });

    try {
        return {
            accounts: JSON.parse(fileData.toString("utf8")),
        };
    }
    catch(error) {
        throw new DigiMeSDKError("Account file is malformed.");
    }
};

const getSaasUrl  = async ({
    redirectUri,
    state,
    applicationId,
    contractId,
    privateKey,
    userAccessToken,
    sdkOptions,
}: SaasOptions & InternalProps): Promise<GetAuthorizationUrlResponse> => {

    if (!isNonEmptyString(applicationId) || !isNonEmptyString(contractId) ||
        !isNonEmptyString(redirectUri) || !privateKey
    ) {
        // tslint:disable-next-line:max-line-length
        throw new TypeValidationError("Details should be a plain object that contains the properties applicationId, contractId, privateKey and redirectUri");
    }

    const {
        code,
        codeVerifier,
        session,
    } = await authorize({
        applicationId,
        contractId,
        privateKey,
        redirectUri,
        state,
        sdkOptions,
        userAccessToken,
    });

    const result: URL = new URL(`http://localhost:3000`);
    result.search = new URLSearchParams({
        code,
        callback: redirectUri,
    }).toString();

    return {
        url: result.toString(),
        codeVerifier,
        session,
    };
};

const exchangeAccessTokenForReference = async ({
    applicationId,
    contractId,
    redirectUri,
    privateKey,
    userAccessToken,
    sdkOptions,
}: ExchangeAccessTokenForReferenceOptions & InternalProps): Promise<ExchangeCodeResponse> => {
    const jwt: string = sign(
        {
            access_token: userAccessToken.accessToken,
            client_id: `${applicationId}_${contractId}`,
            nonce: getRandomAlphaNumeric(32),
            redirect_uri: redirectUri,
            timestamp: new Date().getTime(),
        },
        privateKey.toString(),
        {
            algorithm: "PS512",
            noTimestamp: true,
        },
    );

    const url = `${sdkOptions.baseUrl}/oauth/token/reference`;

    const response = await net.post(url, {
        headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json", // NOTE: we might not need this
        },
        responseType: "json",
    });

    const payload = await getVerifiedJWTPayload(get(response.body, "token"), sdkOptions);

    return {
        code: payload.reference_code,
        session: get(response.body, "session"),
    }
}

export {
    exchangeAccessTokenForReference,
    prepareFilesUsingAccessToken,
    getFile,
    getFileList,
    getSaasUrl,
    getSessionAccounts,
    getSessionData,
};
