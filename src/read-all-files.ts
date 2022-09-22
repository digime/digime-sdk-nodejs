/*!
 * Copyright (c) 2009-2022 digi.me Limited. All rights reserved.
 */

import { TypeValidationError } from "./errors";
import { isNonEmptyString } from "./utils/basic-utils";
import { CAFileListEntry, CAFileListResponse } from "./types/api/ca-file-list-response";
import get from "lodash.get";
import isFunction from "lodash.isfunction";
import { sleep } from "./utils/sleep";
import NodeRSA from "node-rsa";
import { readFile, ReadFileResponse } from "./read-file";
import { readFileList } from "./read-file-list";
import { SDKConfiguration } from "./types/sdk-configuration";

export interface ReadAllFilesOptions {
    sessionKey: string;
    privateKey: NodeRSA.Key;
    onFileData: FileSuccessHandler;
    onFileError: FileErrorHandler;
}

type FileSuccessResult = { fileList: CAFileListEntry[] } & ReadFileResponse;
type FileErrorResult = { fileList: CAFileListEntry[]; error: Error; fileName: string };
type FileSuccessHandler = (response: FileSuccessResult) => void;
type FileErrorHandler = (response: FileErrorResult) => void;

export interface ReadAllFilesResponse {
    stopPolling: () => void;
    filePromise: Promise<unknown>;
}

const readAllFiles = (options: ReadAllFilesOptions, sdkConfig: SDKConfiguration): ReadAllFilesResponse => {
    const { sessionKey, privateKey, onFileData, onFileError } = options;

    if (!isNonEmptyString(sessionKey)) {
        throw new TypeValidationError("Parameter sessionKey should be a non empty string");
    }

    let allowPollingToContinue = true;

    // eslint-disable-next-line no-async-promise-executor
    const allFilesPromise: Promise<void> = new Promise(async (resolve) => {
        const filePromises: Array<Promise<unknown>> = [];
        const handledFiles: { [name: string]: number } = {};
        let state: CAFileListResponse["status"]["state"] = "pending";

        while (allowPollingToContinue && state !== "partial" && state !== "completed") {
            const { status, fileList }: CAFileListResponse = await readFileList({ sessionKey }, sdkConfig);
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
                return readFile({ sessionKey, fileName, privateKey }, sdkConfig)
                    .then((fileMeta) => {
                        if (isFunction(onFileData)) {
                            onFileData({ ...fileMeta, fileList });
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

        Promise.all(filePromises).then(() => {
            resolve();
        });
    });

    return {
        stopPolling: () => {
            allowPollingToContinue = false;
        },
        filePromise: allFilesPromise,
    };
};

export { readAllFiles };
