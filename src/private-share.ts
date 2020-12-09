/*!
 * Copyright (c) 2009-2020 digi.me Limited. All rights reserved.
 */

import { TypeValidationError, DigiMeSDKError } from "./errors";
import { ConsentOnceOptions, ConsentOngoingAccessOptions, GetAuthorizationUrlResponse, GetFileListOptions, GetFileOptions, GetSessionDataOptions, GetSessionDataResponse, PrepareFilesUsingAccessTokenOptions, UserAccessToken, UserDataAccessOptions, UserLibraryAccessResponse} from "./types";
import { isNonEmptyString } from "./utils";
import { getFormattedDeepLink, DigimePaths } from "./paths";
import { URLSearchParams } from "url";
import { authorize, refreshToken } from "./authorisation";
import { handleInvalidatedSdkResponse, net } from "./net";
import { sign } from "jsonwebtoken";
import { decryptData, getRandomAlphaNumeric } from "./crypto";
import { FileMeta, InternalProps } from "./sdk";
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

const getConsentUrl = ({
    applicationId,
    session,
    callbackUrl,
}: ConsentOnceOptions): string => {

    if (!isNonEmptyString(callbackUrl)) {
        throw new TypeValidationError("Parameter callbackUrl should be a non empty string");
    }

    return getFormattedDeepLink(DigimePaths.PRIVATE_SHARE, applicationId, session, new URLSearchParams({ callbackUrl }));
};

const getConsentWithAccessTokenUrl  = async ({
    redirectUri,
    session,
    state,
    applicationId,
    contractId,
    privateKey,
    sdkOptions,
}: ConsentOngoingAccessOptions & InternalProps): Promise<GetAuthorizationUrlResponse> => {

    if (!isNonEmptyString(applicationId) || !isNonEmptyString(contractId) ||
        !isNonEmptyString(redirectUri) || !privateKey
    ) {
        // tslint:disable-next-line:max-line-length
        throw new TypeValidationError("Details should be a plain object that contains the properties applicationId, contractId, privateKey and redirectUri");
    }

    const {preauthorizationCode, codeVerifier} = await authorize({
        applicationId,
        contractId,
        privateKey,
        redirectUri,
        state,
        sdkOptions,
    });

    return {
        url: getFormattedDeepLink(
            DigimePaths.PRIVATE_SHARE,
            applicationId,
            session,
            new URLSearchParams({
                preauthorizationCode,
                callbackUrl: redirectUri,
            }),
        ),
        codeVerifier,
    };
};

const prepareFilesUsingAccessToken = async ({
    applicationId,
    contractId,
    redirectUri,
    privateKey,
    userAccessToken,
    session,
    sdkOptions,
}: PrepareFilesUsingAccessTokenOptions & InternalProps): Promise<UserLibraryAccessResponse> => {

    // 1. We have an access token, try and trigger a data request
    try {
        await triggerDataQuery({
            applicationId,
            contractId,
            redirectUri,
            privateKey,
            accessToken: userAccessToken.accessToken,
            session,
            sdkOptions,
        });
        return { success: true };
    } catch (error) { /* Invalid tokens */ }

    // 2. Wasn't successful, try refreshing the token
    try {
        const newTokens: UserAccessToken = await refreshToken({
            applicationId,
            contractId,
            redirectUri,
            privateKey,
            userAccessToken,
            sdkOptions,
        });

        await triggerDataQuery({
            applicationId,
            contractId,
            redirectUri,
            privateKey,
            accessToken: newTokens.accessToken,
            session,
            sdkOptions,
        });

        return {
            success: true,
            updatedAccessToken: newTokens,
        };
    } catch (error) { /* Refresh unsuccessful */ }

    // Invalid access token and refresh unsuccessful.
    return { success: false }
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
    session,
    sdkOptions,
}: TriggerDataQueryProps & InternalProps): Promise<void> => {
    const jwt: string = sign(
        {
            access_token: accessToken,
            client_id: `${applicationId}_${contractId}`,
            nonce: getRandomAlphaNumeric(32),
            redirect_uri: redirectUri,
            session_key: session.sessionKey,
            timestamp: new Date().getTime(),
        },
        privateKey.toString(),
        {
            algorithm: "PS512",
            noTimestamp: true,
        },
    );

    const url = `${sdkOptions.baseUrl}/permission-access/trigger`;

    await net.post(url, {
        headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json", // NOTE: we might not need this
        },
        responseType: "json",
    });
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

export {
    prepareFilesUsingAccessToken,
    getConsentUrl,
    getConsentWithAccessTokenUrl,
    getFile,
    getFileList,
    getSessionAccounts,
    getSessionData,
};
