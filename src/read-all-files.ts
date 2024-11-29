/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
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
    filePromise: Promise<CAFileListResponse["status"]>;
}

const readAllFiles = (options: ReadAllFilesOptions, sdkConfig: SDKConfiguration): ReadAllFilesResponse => {
    const { sessionKey, privateKey, contractId, onFileData, onFileError, onStatusChange, onAccessTokenChange } =
        options;

    let { userAccessToken } = options;

    if (!isNonEmptyString(sessionKey)) {
        throw new TypeValidationError("Parameter sessionKey should be a non empty string");
    }

    let allowPollingToContinue = true;

    // eslint-disable-next-line no-async-promise-executor, @typescript-eslint/no-misused-promises
    const allFilesPromise: Promise<CAFileListResponse["status"]> = new Promise(async (resolve, reject) => {
        const filePromises: Array<Promise<unknown>> = [];
        const handledFiles: { [name: string]: number } = {};
        let state: CAFileListResponse["status"]["state"] | undefined = "pending";
        let status: CAFileListResponse["status"];

        try {
            while (allowPollingToContinue && state !== "partial" && state !== "completed") {
                const readFileResponse = await readFileList(
                    { sessionKey, contractId, privateKey, userAccessToken },
                    sdkConfig
                );

                const fileList = readFileResponse.fileList;
                const updatedUserAccessToken = readFileResponse.userAccessToken;
                status = readFileResponse.status;

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

                // eslint-disable-next-line unicorn/no-array-reduce
                const newFiles: string[] = (fileList || []).reduce((accumulator: string[], file) => {
                    const { name, updatedDate } = file;

                    if (get(handledFiles, name, 0) < updatedDate) {
                        accumulator.push(name);
                        handledFiles[name] = updatedDate;
                    }

                    return accumulator;
                }, []);

                const newPromises = newFiles.map((fileName: string) => {
                    return (
                        readFile(
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
                            // eslint-disable-next-line @typescript-eslint/use-unknown-in-catch-callback-variable
                            .catch((error) => {
                                // Failed all attempts
                                if (isFunction(onFileError)) {
                                    onFileError({ error, fileName, fileList });
                                }
                                return;
                            })
                    );
                });

                filePromises.push(...newPromises);

                if (state === "running") {
                    await sleep(3000);
                }
            }
            Promise.all(filePromises)
                .then(() => {
                    resolve(status);
                })
                // eslint-disable-next-line @typescript-eslint/use-unknown-in-catch-callback-variable
                .catch((error) => {
                    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                    reject(error);
                });
        } catch (error) {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            reject(error);
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
