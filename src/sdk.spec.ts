/*
 * Copyright (c) 2009-2018 digi.me Limited. All rights reserved.
 */

import { HTTPError } from "got";
import escapeRegExp from "lodash.escaperegexp";
import nock from "nock";
import NodeRSA from "node-rsa";
import { basename } from "path";
import { URL } from "url";
import {
    captureNetworkRequest,
    fileContentToCAFormat,
    loadDefinitions,
    loadScopeDefinitions,
} from "../utils/test-utils";
import * as SDK from "./";
import { ParameterValidationError, SDKInvalidError, SDKVersionInvalidError } from "./errors";
import sdkVersion from "./sdk-version";

type SDKType = ReturnType<typeof SDK.createSDK>;
const customSDK = SDK.createSDK({
    host: "api.digi.test",
    version: "v7",
});

const testKeyPair: NodeRSA = new NodeRSA({ b: 2048 });

beforeEach(() => {
    nock.cleanAll();
});

describe("createSDK", () => {

    describe("Returns an object containing", () => {

        it.each([
            "establishSession",
            "getWebURL",
            "getAppURL",
            "getDataForSession",
        ])("%s function", (property) => {
            expect(customSDK).toHaveProperty(property, expect.any(Function));
        });

    });

    describe("Throws ParameterValidationError when options (first parameter) is", () => {
        // tslint:disable-next-line:max-line-length
        it.each([true, false, null, [], 0, NaN, "", (): null => null, Symbol("test"), { version: null }, { host: null }])(
            "%p",
            (options: any) => {
                expect(() => SDK.createSDK(options)).toThrow(ParameterValidationError);
            },
        );
    });

});

describe.each<[string, SDKType, string, string]>([
    ["Default exported SDK", SDK, "api.digi.me", "v1.0"],
    ["Custom SDK", customSDK, "api.digi.test", "v7"],
])(
    "%s",
    (_title, sdk, host, version) => {

        describe("establishSession", () => {

            it(`Targets API host and version: https://${host}/${version}/`, async () => {
                const callback = jest.fn();
                const scope = nock(`https://${host}`).post(new RegExp(`^/${escapeRegExp(version)}/(.*)`)).reply(200);

                // Request event only fires when the scope target has been hit
                scope.on("request", callback);

                try {
                    await sdk.establishSession("test-application-id", "test-contract-id");
                } catch {
                    // We don't really care about what it returns
                }

                expect(callback).toHaveBeenCalled();
            });

            it("Sends a valid sdkAgent in body", () => {
                const request = captureNetworkRequest({
                    request: () => sdk.establishSession("test-application-id", "test-contract-id"),
                });

                return expect(request).resolves.toHaveBeenCalledWith(
                    expect.objectContaining({
                        body: expect.objectContaining({
                            sdkAgent: expect.objectContaining({
                                name: expect.stringMatching("js"),
                                version: expect.stringMatching(sdkVersion),
                                meta: expect.objectContaining({
                                    node: expect.stringMatching(process.version),
                                }),
                            }),
                        }),
                    }),
                );
            });

            it("Sends appId in body", () => {
                const request = captureNetworkRequest({
                    request: () => sdk.establishSession("test-application-id", "test-contract-id"),
                });

                expect.assertions(1);

                return expect(request).resolves.toHaveBeenCalledWith(
                    expect.objectContaining({
                        body: expect.objectContaining({
                            appId: expect.stringMatching("test-application-id"),
                        }),
                    }),
                );
            });

            it("Sends contractId in body", () => {
                const request = captureNetworkRequest({
                    request: () => sdk.establishSession("test-application-id", "test-contract-id"),
                });

                expect.assertions(1);

                return expect(request).resolves.toHaveBeenCalledWith(
                    expect.objectContaining({
                        body: expect.objectContaining({
                            contractId: expect.stringMatching("test-contract-id"),
                        }),
                    }),
                );
            });

            it("Sends sends scope in body, when defined", () => {
                const request = captureNetworkRequest({
                    request: () => sdk.establishSession(
                        "test-application-id",
                        "test-contract-id",
                        {
                            timeRanges: [{ last: "1Y" }],
                        },
                    ),
                });

                expect.assertions(1);

                return expect(request).resolves.toHaveBeenCalledWith(
                    expect.objectContaining({
                        body: expect.objectContaining({
                            scope: expect.objectContaining({
                                timeRanges: expect.arrayContaining([{ last: "1Y" }]),
                            }),
                        }),
                    }),
                );
            });

            it("Returns session sent in response body", async () => {
                const defs = loadDefinitions("fixtures/network/establish-session/valid-session.json");
                const expected = defs.find((def) => `https://${host}` === def.scope);

                nock.define(defs);

                const promise = sdk.establishSession("test-application-id", "test-contract-id");
                return expect(promise).resolves.toEqual(expected!.response);
            });

            // NOTE: There is no runtime validation of the session object in SDK yet
            it.todo("Throws if session sent in the response body is not of the correct format");

            it("Re-throws HTTPErrors if it encounters one", () => {
                nock.define(loadDefinitions("fixtures/network/establish-session/bad-request.json"));
                const promise = sdk.establishSession("test-application-id", "test-contract-id");
                return expect(promise).rejects.toThrowError(HTTPError);
            });

            it("Throws SDKInvalidError if the API responds with SDKInvalid in error.code", () => {
                nock.define(loadDefinitions("fixtures/network/establish-session/invalid-sdk.json"));
                const promise = sdk.establishSession("test-application-id", "test-contract-id");
                return expect(promise).rejects.toThrowError(SDKInvalidError);
            });

            it("Throws SDKVersionInvalidError if the API responds with SDKVersionInvalid in error.code", () => {
                nock.define(loadDefinitions("fixtures/network/establish-session/invalid-sdk-version.json"));

                const promise = sdk.establishSession("test-application-id", "test-contract-id");
                return expect(promise).rejects.toThrowError(SDKVersionInvalidError);
            });

            it("Re-throws any other uncaught errors", () => {
                // Nock throws a generic error when no matching routes have been defined
                nock(/.*/).delete("/not-matching").reply(200);
                const promise = sdk.establishSession("test-application-id", "test-contract-id");
                return expect(promise).rejects.toThrowError();
            });

            describe("Throws ParameterValidationError when appId (first parameter) is", () => {
                it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                    "%p",
                    (appId: any) => {
                        nock.define(loadDefinitions("fixtures/network/establish-session/valid-session.json"));
                        const promise = sdk.establishSession(appId, "test-contract-id");
                        return expect(promise).rejects.toThrow(ParameterValidationError);
                    },
                );
            });

            describe("Throws ParameterValidationError when contractId (second parameter) is", () => {
                it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                    "%p",
                    (contractId: any) => {
                        nock.define(loadDefinitions("fixtures/network/establish-session/valid-session.json"));
                        const promise = sdk.establishSession("test-application-id", contractId);
                        return expect(promise).rejects.toThrow(ParameterValidationError);
                    },
                );
            });

            // NOTE: Tests skipped as there is no runtime validation of the CA scope in the SDK yet
            describe.skip("Throws ParameterValidationError when CA scope (third parameter) is", () => {
                it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                    "%p",
                    (caScope: any) => {
                        nock.define(loadDefinitions("fixtures/network/establish-session/valid-session.json"));
                        const promise = sdk.establishSession("test-application-id", "test-contract-id", caScope);
                        return expect(promise).rejects.toThrow(ParameterValidationError);
                    },
                );
            });
        });

        describe("getAppURL", () => {

            it.each<[string, string, (url: URL) => unknown]>([
                ["Protocol", "digime:", (url) => url.protocol],
                ["Host", "consent-access", (url) => url.host],
                ["Query \"sessionKey\"", "test-session-key", (url) => url.searchParams.get("sessionKey")],
                ["Query \"appId\"", "test-application-id", (url) => url.searchParams.get("appId")],
                ["Query \"sdkVersion\"", sdkVersion, (url) => url.searchParams.get("sdkVersion")],
                [
                    "Query \"callbackURL\"",
                    "https://callback.test?a=1&b=2#c",
                    (url) => url.searchParams.get("callbackURL"),
                ],
            ])(
                "%s is %p",
                (_label, expected, getter) => {

                    const appUrl = sdk.getAppURL(
                        "test-application-id",
                        {
                            expiry: 0,
                            sessionKey: "test-session-key",
                            sessionExchangeToken: "test-session-exchange-token",
                        },
                        "https://callback.test?a=1&b=2#c",
                    );

                    const actual = getter(new URL(appUrl));
                    expect(actual).toBe(expected);
                },
            );

            describe("Throws ParameterValidationError when appId (first parameter) is", () => {
                it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                    "%p",
                    (appId: any) => {
                        const fn = () => sdk.getAppURL(
                            appId,
                            {
                                expiry: 0,
                                sessionKey: "test-session-key",
                                sessionExchangeToken: "test-session-exchange-token",
                            },
                            "https://callback.test?a=1&b=2#c",
                        );

                        expect(fn).toThrow(ParameterValidationError);
                    },
                );
            });

            describe("Throws ParameterValidationError when session (second parameter) is", () => {
                // tslint:disable-next-line:max-line-length
                it.each([true, false, null, undefined, {}, { expiry: "0", sessionKey: 1 }, [], 0, NaN, "", (): null => null, Symbol("test")])(
                    "%p",
                    (session: any) => {
                        const fn = () => sdk.getAppURL(
                            "test-application-id",
                            session,
                            "https://callback.test?a=1&b=2#c",
                        );

                        expect(fn).toThrow(ParameterValidationError);
                    },
                );
            });

            describe("Throws ParameterValidationError when callbackURL (third parameter) is", () => {
                it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                    "%p",
                    (callbackURL: any) => {
                        const fn = () => sdk.getAppURL(
                            "test-application-id",
                            {
                                expiry: 0,
                                sessionKey: "test-session-key",
                                sessionExchangeToken: "test-session-exchange-token",
                            },
                            callbackURL,
                        );

                        expect(fn).toThrow(ParameterValidationError);
                    },
                );
            });

        });

        describe("getWebURL", () => {

            it.each<[string, string, (url: URL) => unknown]>([
                ["Protocol", "https:", (url) => url.protocol],
                ["Host", host, (url) => url.host],
                ["Pathname", "/apps/quark/direct-onboarding", (url) => url.pathname],
                [
                    "Query \"sessionExchangeToken\"",
                    "test-session-exchange-token",
                    (url) => url.searchParams.get("sessionExchangeToken"),
                ],
                [
                    "Query \"callbackURL\"",
                    "https://callback.test?a=1&b=2#c",
                    (url) => url.searchParams.get("callbackUrl"),
                ],
            ])(
                "%s is %p",
                (_label, expected, getter) => {

                    const appUrl = sdk.getWebURL(
                        {
                            expiry: 0,
                            sessionKey: "test-session-key",
                            sessionExchangeToken: "test-session-exchange-token",
                        },
                        "https://callback.test?a=1&b=2#c",
                    );

                    const actual = getter(new URL(appUrl));
                    expect(actual).toBe(expected);
                },
            );

            describe("Throws ParameterValidationError when session (first parameter) is", () => {
                // tslint:disable-next-line:max-line-length
                it.each([true, false, null, undefined, {}, { expiry: "0", sessionKey: 1 }, [], 0, NaN, "", (): null => null, Symbol("test")])(
                    "%p",
                    (session: any) => {
                        const fn = () => sdk.getWebURL(
                            session,
                            "https://callback.test?a=1&b=2#c",
                        );

                        expect(fn).toThrow(ParameterValidationError);
                    },
                );
            });

            describe("Throws ParameterValidationError when callbackUrl (second parameter) is", () => {
                it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                    "%p",
                    (callbackURL: any) => {
                        const fn = () => sdk.getWebURL(
                            {
                                expiry: 0,
                                sessionKey: "test-session-key",
                                sessionExchangeToken: "test-session-exchange-token",
                            },
                            callbackURL,
                        );

                        expect(fn).toThrow(ParameterValidationError);
                    },
                );
            });

        });

        describe("getDataForSession", () => {

            it(`Requests target API host and version: https://${host}/${version}/`, async () => {
                const listScopes = nock.define(
                    loadDefinitions("fixtures/network/get-file-list/valid-file-list.json"),
                );
                const fileScopes = nock.define(
                    loadDefinitions("fixtures/network/get-file/valid-files.json"),
                );

                const listCallback = jest.fn();
                const fileCallback = jest.fn();

                listScopes.forEach((scope) => {
                    scope.on("request", listCallback);
                });

                fileScopes.forEach((scope) => {
                    scope.on("request", fileCallback);
                });

                await sdk.getDataForSession(
                    "test-session-key",
                    testKeyPair.exportKey("pkcs1-private-pem"),
                    () => null,
                    () => null,
                );

                expect(listCallback).toHaveBeenCalledTimes(1);
                expect(fileCallback).toHaveBeenCalledTimes(3);
            });

            describe("Throws ParameterValidationError when sessionKey (first parameter) is", () => {

                it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                    "%p",
                    (sessionKey: any) => {
                        const promise = sdk.getDataForSession(
                            sessionKey,
                            testKeyPair.exportKey("pkcs1-private-pem"),
                            () => null,
                            () => null,
                        );

                        return expect(promise).rejects.toThrow(ParameterValidationError);
                    },
                );

            });

            describe("Triggers onFileData (third parameter) with the correct data when it", () => {

                it.each<[string, string]>([
                    ["uncompressed", "valid-files.json"],
                    ["brotlified", "valid-files-compression-brotli.json"],
                    ["gzipped", "valid-files-compression-gzip.json"],
                ])("Retrieves encrypted and %s files", async (_label, file) => {
                    const fileListDefs = loadScopeDefinitions(
                        "fixtures/network/get-file-list/valid-file-list.json",
                        `https://${host}`,
                    );
                    nock.define(fileListDefs);

                    const fileList: string[] = fileListDefs[0].response.fileList;
                    const fileDefs = loadScopeDefinitions(
                        `fixtures/network/get-file/${file}`,
                        `https://${host}`,
                    );

                    const caFormatted = await fileContentToCAFormat(
                        fileDefs,
                        testKeyPair,
                    );

                    nock.define(caFormatted);

                    const successCallback = jest.fn();

                    await sdk.getDataForSession(
                        "test-session-key",
                        testKeyPair.exportKey("pkcs1-private-pem"),
                        successCallback,
                        () => null,
                    );

                    expect(successCallback).toHaveBeenCalledTimes(fileDefs.length);

                    fileDefs.forEach((fileDef) => {
                        expect(successCallback).toHaveBeenCalledWith(expect.objectContaining({
                            fileData: fileDef.response.fileContent,
                            fileName: basename(fileDef.path),
                            fileList,
                            fileDescriptor: fileDef.response.fileMetadata,
                        }));
                    });
                });

            });

            describe("Triggers onFileError (fourth parameter) correctly", () => {

                it.each<[string, string, string, NodeRSA, boolean, boolean]>([
                    // tslint:disable:max-line-length
                    ["SyntaxError", "it receives invalid JSON", "invalid-json-in-file-content.json", testKeyPair, false, false],
                    ["Error", "brotli decompression fails", "valid-files-compression-brotli.json", testKeyPair, false, false],
                    ["Error", "gzip decompression fails", "valid-files-compression-gzip.json", testKeyPair, false, false],
                    ["Error", "decryption fails due to wrong key", "valid-files.json", new NodeRSA({ b: 2048 }), false, false],
                    ["FileDecryptionError", "the data length validation fails", "valid-files.json", testKeyPair, true, false],
                    ["FileDecryptionError", "the hash validation fails", "valid-files.json", testKeyPair, false, true],
                    // tslint:enable:max-line-length
                ])(
                    "With %p error when %s",
                    async (errorName, _label2, file, keyPair, corruptLength, corruptHash) => {
                        const fileListDefs = loadScopeDefinitions(
                            "fixtures/network/get-file-list/valid-file-list.json",
                            `https://${host}`,
                        );
                        nock.define(fileListDefs);

                        const fileList: string[] = fileListDefs[0].response.fileList;

                        const fileDefs = loadScopeDefinitions(`fixtures/network/get-file/${file}`, `https://${host}`);

                        const caFormatted = await fileContentToCAFormat(
                            fileDefs,
                            keyPair,
                            {
                                overrideCompression: "no-compression",
                                corruptLength,
                                corruptHash,
                            },
                        );

                        nock.define(caFormatted);

                        const failureCallback = jest.fn();

                        await sdk.getDataForSession(
                            "test-session-key",
                            testKeyPair.exportKey("pkcs1-private-pem"),
                            () => null,
                            failureCallback,
                        );

                        expect(failureCallback).toHaveBeenCalledTimes(fileList.length);

                        fileList.forEach((fileListFile) => {
                            expect(failureCallback).toHaveBeenCalledWith(expect.objectContaining({
                                // Comparing names as apparently Error is not an instance of Error in some cases?
                                error: expect.objectContaining({ name: errorName }),
                                fileName: fileListFile,
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
