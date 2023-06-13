/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { TypeValidationError } from "./errors";
import { isNonEmptyString } from "./utils/basic-utils";
import { CAFileListEntry, CAFileListResponse, LibrarySyncStatus } from "./types/api/ca-file-list-response";
import get from "lodash.get";
import isFunction from "lodash.isfunction";
import { sleep } from "./utils/sleep";
import NodeRSA from "node-rsa";
import { readFile, ReadFileResponse } from "./read-file";
import { readFileList } from "./read-file-list";
import { SDKConfiguration } from "./types/sdk-configuration";
import { UserAccessToken } from "./types/user-access-token";

export interface ReadAllFilesOptions {
    sessionKey: string;
    privateKey: NodeRSA.Key;
    contractId: string;
    userAccessToken: UserAccessToken;
    onFileData: FileSuccessHandler;
    onFileError: FileErrorHandler;
    onStatusChange?: StatusChangeHandler;
    onAccessTokenChange?: AccessTokenChangeHandler;
}

type FileSuccessResult = { fileList: CAFileListEntry[] | undefined } & ReadFileResponse;
type FileErrorResult = { fileList: CAFileListEntry[] | undefined; error: Error; fileName: string };
type FileSuccessHandler = (response: FileSuccessResult) => void;
type FileErrorHandler = (response: FileErrorResult) => void;
type StatusChangeHandler = (response: LibrarySyncStatus) => void;
type AccessTokenChangeHandler = (response: UserAccessToken) => void;

export interface ReadAllFilesResponse {
    stopPolling: () => void;
    filePromise: Promise<unknown>;
}

const readAllFiles = (options: ReadAllFilesOptions, sdkConfig: SDKConfiguration): ReadAllFilesResponse => {
    const { sessionKey, privateKey, contractId, onFileData, onFileError, onStatusChange, onAccessTokenChange } =
        options;

    let { userAccessToken } = options;

    if (!isNonEmptyString(sessionKey)) {
        throw new TypeValidationError("Parameter sessionKey should be a non empty string");
    }

    let allowPollingToContinue = true;

    // eslint-disable-next-line no-async-promise-executor
    const allFilesPromise: Promise<void> = new Promise(async (resolve, reject) => {
        const filePromises: Array<Promise<unknown>> = [];
        const handledFiles: { [name: string]: number } = {};
        let state: CAFileListResponse["status"]["state"] | undefined = "pending";

        try {
            while (allowPollingToContinue && state !== "partial" && state !== "completed") {
                const {
                    status,
                    fileList,
                    userAccessToken: updatedUserAccessToken,
                }: CAFileListResponse = await readFileList(
                    { sessionKey, contractId, privateKey, userAccessToken },
                    sdkConfig
                );

                // if readFileList returns refreshed access token we need to use that for readFile method
                if (updatedUserAccessToken && userAccessToken.accessToken !== updatedUserAccessToken.accessToken) {
                    userAccessToken = updatedUserAccessToken;
                    if (isFunction(onAccessTokenChange)) {
                        onAccessTokenChange(updatedUserAccessToken);
                    }
                }

                if (isFunction(onStatusChange) && state !== status.state) {
                    onStatusChange(status.state);
                }

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
                    return readFile(
                        {
                            sessionKey,
                            fileName,
                            privateKey,
                            userAccessToken,
                            contractId,
                        },
                        sdkConfig
                    )
                        .then((fileResponse) => {
                            if (isFunction(onFileData)) {
                                if (
                                    fileResponse.userAccessToken &&
                                    userAccessToken !== fileResponse.userAccessToken &&
                                    isFunction(onAccessTokenChange)
                                ) {
                                    userAccessToken = fileResponse.userAccessToken;
                                    onAccessTokenChange(userAccessToken);
                                }
                                onFileData({ ...fileResponse, fileList });
                            }
                            return;
                        })
                        .catch((error) => {
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
            Promise.all(filePromises)
                .then(() => {
                    resolve();
                })
                .catch((e) => {
                    reject(e);
                });
        } catch (e) {
            reject(e);
        }
    });

    return {
        stopPolling: () => {
            allowPollingToContinue = false;
        },
        filePromise: allFilesPromise,
    };
};

export { readAllFiles };
