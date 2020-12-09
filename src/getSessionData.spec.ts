/*!
 * Copyright (c) 2009-2020 digi.me Limited. All rights reserved.
 */

import { get, isPlainObject } from "lodash";
import nock from "nock";
import NodeRSA from "node-rsa";
import { basename } from "path";
import { URL } from "url";
import * as SDK from ".";
import { fileContentToCAFormat, loadScopeDefinitions } from "../utils/test-utils";
import { TypeValidationError } from "./errors";

jest.mock("./sleep");

const customSDK = SDK.init({
    baseUrl: "https://api.digi.test/v7",
});

const testKeyPair: NodeRSA = new NodeRSA({ b: 2048 });

beforeEach(() => {
    nock.cleanAll();
    nock.disableNetConnect();
});

describe.each<[string, ReturnType<typeof SDK.init>, string]>([
    ["Default exported SDK", SDK, "https://api.digi.me/v1.5"],
    ["Custom SDK", customSDK, "https://api.digi.test/v7"],
])(
    "%s",
    (_title, sdk, baseUrl) => {

        describe(`getSessionData`, () => {
            it("Returns a promise and a function", async () => {
                nock(`${new URL(baseUrl).origin}`)
                    .get(`${new URL(baseUrl).pathname}/permission-access/query/test-session-key`)
                    .reply(200, {
                        status: {
                            state: "completed",
                        },
                    });

                const {stopPolling, filePromise} = sdk.pull.getSessionData({
                    sessionKey: "test-session-key",
                    privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
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
                    const listScopes = nock.define(loadScopeDefinitions(
                        fixturePath,
                        `${new URL(baseUrl).origin}`,
                    ));

                    const listCallback = jest.fn();

                    listScopes.forEach((scope) => {
                        scope.on("request", listCallback);
                    });

                    const {filePromise} = sdk.pull.getSessionData({
                        sessionKey: "test-session-key",
                        privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
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
                    .get(`${new URL(baseUrl).pathname}/permission-access/query/test-session-key`)
                    .reply(200, {
                        status: {
                            state: "pending",
                        },
                    })
                    .get(`${new URL(baseUrl).pathname}/permission-access/query/test-session-key`)
                    .reply(200, {
                        status: {
                            state: "completed",
                        },
                    });

                const listCallback = jest.fn();
                scope.on("request", listCallback);

                const { filePromise } = sdk.pull.getSessionData({
                    sessionKey: "test-session-key",
                    privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
                    onFileData:  () => null,
                    onFileError: () => null,
                });

                await filePromise;
                expect.assertions(1);
                expect(listCallback).toHaveBeenCalledTimes(2);
            })

            describe("Triggers onFileData with the correct data when it", () => {
                it.each<[string, string]>([
                    ["uncompressed", "valid-files.json"],
                ])("retrieves encrypted and %s files",
                async (_label, file) => {
                    const fileList = [
                        {name: "file1.json", updatedDate: 1568716294874},
                        {name: "file2.json", updatedDate: 1568716294874},
                        {name: "file3.json", updatedDate: 1568716294874},
                    ];

                    nock(`${new URL(baseUrl).origin}`)
                        .get(`${new URL(baseUrl).pathname}/permission-access/query/test-session-key`)
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
                        .get(`${new URL(baseUrl).pathname}/permission-access/query/test-session-key`)
                        .reply(200, {
                            status: {
                                state: "completed",
                            },
                        });

                    const fileDefs = loadScopeDefinitions(
                        `fixtures/network/get-file/${file}`,
                        `${new URL(baseUrl).origin}`,
                    );

                    const caFormatted = fileContentToCAFormat(fileDefs, testKeyPair);

                    nock.define(caFormatted);
                    const successCallback = jest.fn();

                    const {filePromise} = sdk.pull.getSessionData({
                        sessionKey: "test-session-key",
                        privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
                        onFileData: successCallback,
                        onFileError: () => null,
                    });

                    await filePromise;

                    expect(successCallback).toHaveBeenCalledTimes(fileDefs.length);

                    fileDefs.forEach((fileDef) => {

                        const xMetaData = get(fileDef, ["rawHeaders", "x-metadata"])
                        const {metadata} = xMetaData
                        const response: any = isPlainObject(fileDef.response)
                            ? JSON.stringify(fileDef.response)
                            : fileDef.response;

                        expect(successCallback).toHaveBeenCalledWith(expect.objectContaining({
                            fileData: Buffer.from(response),
                            fileName: basename(fileDef.path),
                            fileList,
                            fileMetadata: metadata,
                        }));
                    });
                });
            });

            it("Calls onFileData() callback if a filelist is returned and files downloaded successfully", async () => {
                nock(`${new URL(baseUrl).origin}`)
                    .get(`${new URL(baseUrl).pathname}/permission-access/query/test-session-key`)
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
                            {name: "file1.json", updatedDate: 1568716294874},
                            {name: "file2.json", updatedDate: 1568716294874},
                            {name: "file3.json", updatedDate: 1568716294874},
                        ],
                    })
                    .get(`${new URL(baseUrl).pathname}/permission-access/query/test-session-key`)
                    .reply(200, {
                        status: {
                            state: "completed",
                        },
                    });

                const fileDefs = loadScopeDefinitions(
                    "fixtures/network/get-file/valid-files.json",
                    `${new URL(baseUrl).origin}`,
                );

                const caFormatted = fileContentToCAFormat(fileDefs, testKeyPair);
                nock.define(caFormatted);
                const onFileData = jest.fn();

                const {filePromise} = sdk.pull.getSessionData({
                    sessionKey: "test-session-key",
                    privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
                    onFileData,
                    onFileError: () => null,
                });

                await filePromise;
                expect.assertions(1);
                expect(onFileData).toHaveBeenCalledTimes(3);
            });

            it("Redownloads the file again if updated date changes between polling", async () => {
                nock(`${new URL(baseUrl).origin}`)
                    .get(`${new URL(baseUrl).pathname}/permission-access/query/test-session-key`)
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
                            {name: "file1.json", updatedDate: 10},
                            {name: "file2.json", updatedDate: 10},
                            {name: "file3.json", updatedDate: 10},
                        ],
                    })
                    .get(`${new URL(baseUrl).pathname}/permission-access/query/test-session-key`)
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
                            {name: "file1.json", updatedDate: 20},
                            {name: "file2.json", updatedDate: 20},
                            {name: "file3.json", updatedDate: 20},
                        ],
                    })
                    .get(`${new URL(baseUrl).pathname}/permission-access/query/test-session-key`)
                    .reply(200, {
                        status: {
                            state: "completed",
                        },
                    });

                const fileDefs = loadScopeDefinitions(
                    "fixtures/network/get-file/valid-files.json",
                    `${new URL(baseUrl).origin}`,
                );

                const caFormatted = fileContentToCAFormat(fileDefs, testKeyPair);
                const scopes = nock.define(caFormatted);
                scopes.map((scope) => scope.persist(true));
                const onFileData = jest.fn();

                const {filePromise} = sdk.pull.getSessionData({
                    sessionKey: "test-session-key",
                    privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
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
                    .get(`${new URL(baseUrl).pathname}/permission-access/query/test-session-key`)
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
                            {name: "file1.json", updatedDate: 10},
                            {name: "file2.json", updatedDate: 10},
                            {name: "file3.json", updatedDate: 10},
                        ],
                    });

                const fileDefs = loadScopeDefinitions(
                    "fixtures/network/get-file/valid-files.json",
                    `${new URL(baseUrl).origin}`,
                );

                const caFormatted = fileContentToCAFormat(fileDefs, testKeyPair);
                nock.define(caFormatted);
                const onFileData = jest.fn();

                const {filePromise, stopPolling} = sdk.pull.getSessionData({
                    sessionKey: "test-session-key",
                    privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
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
                        expect(() => sdk.pull.getSessionData({
                            sessionKey,
                            privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
                            onFileData: () => null,
                            onFileError: () => null,
                        })).toThrow(TypeValidationError);
                    },
                );
            });

            describe("Triggers onFileError correctly", () => {
                it.each<[string, string, string, NodeRSA, boolean, boolean]>([
                    // tslint:disable:max-line-length
                    ["Error", "brotli decompression fails", "valid-files-compression-brotli.json", testKeyPair, false, false],
                    ["Error", "gzip decompression fails", "valid-files-compression-gzip.json", testKeyPair, false, false],
                    ["Error", "decryption fails due to wrong key", "valid-files.json", new NodeRSA({ b: 2048 }), false, false],
                    ["FileDecryptionError", "the data length validation fails", "valid-files.json", testKeyPair, true, false],
                    ["FileDecryptionError", "the hash validation fails", "valid-files.json", testKeyPair, false, true],
                    // tslint:enable:max-line-length
                ])(
                    "With %p error when %s",
                    async (errorName, _label2, file, keyPair, corruptLength, corruptHash) => {
                        const fileList = [
                            {name: "file1.json", updatedDate: 1568716294874},
                            {name: "file2.json", updatedDate: 1568716294874},
                            {name: "file3.json", updatedDate: 1568716294874},
                        ];

                        nock(`${new URL(baseUrl).origin}`)
                            .get(`${new URL(baseUrl).pathname}/permission-access/query/test-session-key`)
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
                            .get(`${new URL(baseUrl).pathname}/permission-access/query/test-session-key`)
                            .reply(200, {
                                status: {
                                    state: "completed",
                                },
                            });

                        const fileDefs = loadScopeDefinitions(
                            `fixtures/network/get-file/${file}`,
                            `${new URL(baseUrl).origin}`,
                        );

                        const caFormatted = fileContentToCAFormat(
                            fileDefs,
                            keyPair,
                            {
                                overrideCompression: "no-compression",
                                corruptLength,
                                corruptHash,
                            },
                        );

                        nock.define(caFormatted);

                        const onFileError = jest.fn();

                        const {filePromise} = sdk.pull.getSessionData({
                            sessionKey: "test-session-key",
                            privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
                            onFileData: () => null,
                            onFileError,
                        });

                        await filePromise;

                        expect(onFileError).toHaveBeenCalledTimes(fileList.length);

                        fileList.forEach((fileListFile) => {
                            expect(onFileError).toHaveBeenCalledWith(expect.objectContaining({
                                // Comparing names as apparently Error is not an instance of Error in some cases?
                                error: expect.objectContaining({ name: errorName }),
                                fileName: fileListFile.name,
                                fileList,
                            }));
                        });
                    },
                );
            });

            // NOTE: This is currently messed up, we'll test it when we fix it
            it.todo("Performs network request retries in case network is not available");
        });
    },
);
