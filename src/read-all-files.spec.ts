/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import get from "lodash.get";
import { isPlainObject } from "./utils/basic-utils";
import nock from "nock";
import NodeRSA from "node-rsa";
import { basename } from "path";
import { URL } from "url";
import * as SDK from ".";
import { fileContentToCAFormat, loadScopeDefinitions } from "../utils/test-utils";
import { TypeValidationError } from "./errors";
import { SAMPLE_TOKEN, TEST_BASE_URL, TEST_CUSTOM_BASE_URL, TEST_CUSTOM_ONBOARD_URL } from "../utils/test-constants";

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock("./utils/sleep");

const digime = SDK.init({
    applicationId: "test-application-id",
});

const customSDK = SDK.init({
    applicationId: "test-application-id",
    baseUrl: TEST_CUSTOM_BASE_URL,
    onboardUrl: TEST_CUSTOM_ONBOARD_URL,
});

const testKeyPair: NodeRSA = new NodeRSA({ b: 2048 });

beforeEach(() => {
    nock.cleanAll();
    nock.disableNetConnect();
});

describe.each<[string, ReturnType<typeof SDK.init>, string]>([
    ["Default exported SDK", digime, TEST_BASE_URL],
    ["Custom SDK", customSDK, TEST_CUSTOM_BASE_URL],
])("%s", (_title, sdk, baseUrl) => {
    describe(`getSessionData`, () => {
        it("Returns a promise and a function", async () => {
            nock(`${new URL(baseUrl).origin}`)
                .get(`${new URL(baseUrl).pathname}permission-access/query/test-session-key`)
                .reply(200, {
                    status: {
                        state: "completed",
                    },
                });

            const { stopPolling, filePromise } = sdk.readAllFiles({
                sessionKey: "test-session-key",
                privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
                contractId: "test-contract-id",
                userAccessToken: SAMPLE_TOKEN,
                onFileData: () => null,
                onFileError: () => null,
            });

            await filePromise;

            expect(stopPolling).toBeInstanceOf(Function);
            expect(filePromise).toBeInstanceOf(Promise);
        });

        describe(`Stops polling when the state is`, () => {
            it.each<[string, string]>([
                ["partial", "fixtures/network/get-file-list/file-list-partial.json"],
                ["completed", "fixtures/network/get-file-list/file-list-completed.json"],
            ])("%s", async (_state, fixturePath) => {
                const listScopes = nock.define(loadScopeDefinitions(fixturePath, `${new URL(baseUrl).origin}`));

                const listCallback = jest.fn();

                for (const scope of listScopes) {
                    scope.on("request", listCallback);
                }

                const { filePromise } = sdk.readAllFiles({
                    sessionKey: "test-session-key",
                    privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
                    contractId: "test-contract-id",
                    userAccessToken: SAMPLE_TOKEN,
                    onFileData: () => null,
                    onFileError: () => null,
                });

                await filePromise;
                expect.assertions(1);
                expect(listCallback).toHaveBeenCalledTimes(1);
            });
        });

        it("Continues polling if the status returned is pending", async () => {
            const scope = nock(`${new URL(baseUrl).origin}`)
                .get(`${new URL(baseUrl).pathname}permission-access/query/test-session-key`)
                .reply(200, {
                    status: {
                        state: "pending",
                    },
                })
                .get(`${new URL(baseUrl).pathname}permission-access/query/test-session-key`)
                .reply(200, {
                    status: {
                        state: "completed",
                    },
                });

            const listCallback = jest.fn();
            scope.on("request", listCallback);

            const { filePromise } = sdk.readAllFiles({
                sessionKey: "test-session-key",
                privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
                contractId: "test-contract-id",
                userAccessToken: SAMPLE_TOKEN,
                onFileData: () => null,
                onFileError: () => null,
            });

            await filePromise;
            expect.assertions(1);
            expect(listCallback).toHaveBeenCalledTimes(2);
        });

        describe("Triggers onFileData with the correct data when it", () => {
            it.each<[string, string]>([["uncompressed", "valid-files.json"]])(
                "retrieves encrypted and %s files",
                async (_label, file) => {
                    const fileList = [
                        { name: "file1.json", updatedDate: 1568716294874 },
                        { name: "file2.json", updatedDate: 1568716294874 },
                        { name: "file3.json", updatedDate: 1568716294874 },
                    ];

                    nock(`${new URL(baseUrl).origin}`)
                        .get(`${new URL(baseUrl).pathname}permission-access/query/test-session-key`)
                        .reply(200, {
                            status: {
                                details: {
                                    "test-account-id": {
                                        state: "running",
                                    },
                                },
                                state: "running",
                            },
                            fileList,
                        })
                        .get(`${new URL(baseUrl).pathname}permission-access/query/test-session-key`)
                        .reply(200, {
                            status: {
                                state: "completed",
                            },
                        });

                    const fileDefs = loadScopeDefinitions(
                        `fixtures/network/get-file/${file}`,
                        `${new URL(baseUrl).origin}`
                    );

                    const caFormatted = fileContentToCAFormat(fileDefs, testKeyPair);

                    nock.define(caFormatted);
                    const successCallback = jest.fn();

                    const { filePromise } = sdk.readAllFiles({
                        sessionKey: "test-session-key",
                        privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
                        contractId: "test-contract-id",
                        userAccessToken: SAMPLE_TOKEN,
                        onFileData: successCallback,
                        onFileError: () => null,
                    });

                    await filePromise;

                    expect(successCallback).toHaveBeenCalledTimes(fileDefs.length);

                    for (const fileDef of fileDefs) {
                        const xMetaData = get(fileDef, ["rawHeaders", "x-metadata"]);
                        const { metadata } = xMetaData;
                        const response: any = isPlainObject(fileDef.response)
                            ? JSON.stringify(fileDef.response)
                            : fileDef.response;

                        expect(successCallback).toHaveBeenCalledWith(
                            expect.objectContaining({
                                fileData: Buffer.from(response),
                                fileName: basename(fileDef.path.toString()),
                                fileList,
                                fileMetadata: metadata,
                            })
                        );
                    }
                }
            );
        });

        it("Calls onFileData() callback if a filelist is returned and files downloaded successfully", async () => {
            nock(`${new URL(baseUrl).origin}`)
                .get(`${new URL(baseUrl).pathname}permission-access/query/test-session-key`)
                .reply(200, {
                    status: {
                        details: {
                            "test-account-id": {
                                state: "running",
                            },
                        },
                        state: "running",
                    },
                    fileList: [
                        { name: "file1.json", updatedDate: 1568716294874 },
                        { name: "file2.json", updatedDate: 1568716294874 },
                        { name: "file3.json", updatedDate: 1568716294874 },
                    ],
                })
                .get(`${new URL(baseUrl).pathname}permission-access/query/test-session-key`)
                .reply(200, {
                    status: {
                        state: "completed",
                    },
                });

            const fileDefs = loadScopeDefinitions(
                "fixtures/network/get-file/valid-files.json",
                `${new URL(baseUrl).origin}`
            );

            const caFormatted = fileContentToCAFormat(fileDefs, testKeyPair);
            nock.define(caFormatted);
            const onFileData = jest.fn();

            const { filePromise } = sdk.readAllFiles({
                sessionKey: "test-session-key",
                privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
                contractId: "test-contract-id",
                userAccessToken: SAMPLE_TOKEN,
                onFileData,
                onFileError: () => null,
            });

            await filePromise;
            expect.assertions(1);
            expect(onFileData).toHaveBeenCalledTimes(3);
        });

        it("Redownloads the file again if updated date changes between polling", async () => {
            nock(`${new URL(baseUrl).origin}`)
                .get(`${new URL(baseUrl).pathname}permission-access/query/test-session-key`)
                .reply(200, {
                    status: {
                        details: {
                            "test-account-id": {
                                state: "running",
                            },
                        },
                        state: "running",
                    },
                    fileList: [
                        { name: "file1.json", updatedDate: 10 },
                        { name: "file2.json", updatedDate: 10 },
                        { name: "file3.json", updatedDate: 10 },
                    ],
                })
                .get(`${new URL(baseUrl).pathname}permission-access/query/test-session-key`)
                .reply(200, {
                    status: {
                        details: {
                            "test-account-id": {
                                state: "running",
                            },
                        },
                        state: "running",
                    },
                    fileList: [
                        { name: "file1.json", updatedDate: 20 },
                        { name: "file2.json", updatedDate: 20 },
                        { name: "file3.json", updatedDate: 20 },
                    ],
                })
                .get(`${new URL(baseUrl).pathname}permission-access/query/test-session-key`)
                .reply(200, {
                    status: {
                        state: "completed",
                    },
                });

            const fileDefs = loadScopeDefinitions(
                "fixtures/network/get-file/valid-files.json",
                `${new URL(baseUrl).origin}`
            );

            const caFormatted = fileContentToCAFormat(fileDefs, testKeyPair);
            const scopes = nock.define(caFormatted);
            scopes.map((scope) => scope.persist(true));
            const onFileData = jest.fn();

            const { filePromise } = sdk.readAllFiles({
                sessionKey: "test-session-key",
                privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
                contractId: "test-contract-id",
                userAccessToken: SAMPLE_TOKEN,
                onFileData,
                onFileError: () => null,
            });

            await filePromise;
            expect.assertions(1);
            expect(onFileData).toHaveBeenCalledTimes(6);
        });

        it("Stops the polling when stopPolling function is triggered", async () => {
            nock(`${new URL(baseUrl).origin}`)
                .persist()
                .get(`${new URL(baseUrl).pathname}permission-access/query/test-session-key`)
                .reply(200, {
                    status: {
                        details: {
                            "test-account-id": {
                                state: "running",
                            },
                        },
                        state: "running",
                    },
                    fileList: [
                        { name: "file1.json", updatedDate: 10 },
                        { name: "file2.json", updatedDate: 10 },
                        { name: "file3.json", updatedDate: 10 },
                    ],
                });

            const fileDefs = loadScopeDefinitions(
                "fixtures/network/get-file/valid-files.json",
                `${new URL(baseUrl).origin}`
            );

            const caFormatted = fileContentToCAFormat(fileDefs, testKeyPair);
            nock.define(caFormatted);
            const onFileData = jest.fn();

            const { filePromise, stopPolling } = sdk.readAllFiles({
                sessionKey: "test-session-key",
                privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
                contractId: "test-contract-id",
                userAccessToken: SAMPLE_TOKEN,
                onFileData,
                onFileError: () => null,
            });

            stopPolling();
            expect.assertions(1);

            await filePromise;
            expect(onFileData).toHaveBeenCalledTimes(3);
        });

        describe("Throws TypeValidationError when sessionKey (first parameter) is", () => {
            it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                "%p",
                (sessionKey: any) => {
                    expect(() =>
                        sdk.readAllFiles({
                            sessionKey,
                            privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
                            contractId: "test-contract-id",
                            userAccessToken: SAMPLE_TOKEN,
                            onFileData: () => null,
                            onFileError: () => null,
                        })
                    ).toThrow(TypeValidationError);
                }
            );
        });

        describe("Triggers onFileError correctly", () => {
            it.each<[string, string, string, NodeRSA, boolean, boolean]>([
                // tslint:disable:max-line-length
                [
                    "Error",
                    "brotli decompression fails",
                    "valid-files-compression-brotli.json",
                    testKeyPair,
                    false,
                    false,
                ],
                ["Error", "gzip decompression fails", "valid-files-compression-gzip.json", testKeyPair, false, false],
                [
                    "Error",
                    "decryption fails due to wrong key",
                    "valid-files.json",
                    new NodeRSA({ b: 2048 }),
                    false,
                    false,
                ],
                [
                    "FileDecryptionError",
                    "the data length validation fails",
                    "valid-files.json",
                    testKeyPair,
                    true,
                    false,
                ],
                // tslint:enable:max-line-length
            ])("With %p error when %s", async (errorName, _label2, file, keyPair, corruptLength) => {
                const fileList = [
                    { name: "file1.json", updatedDate: 1568716294874 },
                    { name: "file2.json", updatedDate: 1568716294874 },
                    { name: "file3.json", updatedDate: 1568716294874 },
                ];

                nock(`${new URL(baseUrl).origin}`)
                    .get(`${new URL(baseUrl).pathname}permission-access/query/test-session-key`)
                    .reply(200, {
                        status: {
                            details: {
                                "test-account-id": {
                                    state: "running",
                                },
                            },
                            state: "running",
                        },
                        fileList,
                    })
                    .get(`${new URL(baseUrl).pathname}permission-access/query/test-session-key`)
                    .reply(200, {
                        status: {
                            state: "completed",
                        },
                    });

                const fileDefs = loadScopeDefinitions(
                    `fixtures/network/get-file/${file}`,
                    `${new URL(baseUrl).origin}`
                );

                const caFormatted = fileContentToCAFormat(fileDefs, keyPair, {
                    overrideCompression: "no-compression",
                    corruptLength,
                });

                nock.define(caFormatted);

                const onFileError = jest.fn();

                const { filePromise } = sdk.readAllFiles({
                    sessionKey: "test-session-key",
                    privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
                    contractId: "test-contract-id",
                    userAccessToken: SAMPLE_TOKEN,
                    onFileData: () => null,
                    onFileError,
                });

                await filePromise;

                expect(onFileError).toHaveBeenCalledTimes(fileList.length);

                for (const fileListFile of fileList) {
                    expect(onFileError).toHaveBeenCalledWith(
                        expect.objectContaining({
                            // Comparing names as apparently Error is not an instance of Error in some cases?
                            error: expect.objectContaining({ name: errorName }),
                            fileName: fileListFile.name,
                            fileList,
                        })
                    );
                }
            });
        });

        // NOTE: This is currently messed up, we'll test it when we fix it
        it.todo("Performs network request retries in case network is not available");
    });
});
