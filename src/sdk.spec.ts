/*
 * Copyright (c) 2009-2018 digi.me Limited. All rights reserved.
 */

import { HTTPError } from "got";
import { Dictionary } from "lodash";
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

const customSDK = SDK.init({
    baseUrl: "https://api.digi.test/v7",
});

const testKeyPair: NodeRSA = new NodeRSA({ b: 2048 });

beforeEach(() => {
    nock.cleanAll();
});

describe("init", () => {

    describe("Returns an object containing", () => {

        it.each([
            "establishSession",
            "getAuthorizeUrl",
            "getGuestAuthorizeUrl",
            "getReceiptUrl",
            "getSessionData",
        ])("%s function", (property) => {
            expect(customSDK).toHaveProperty(property, expect.any(Function));
        });

    });

    describe("Throws ParameterValidationError when options (first parameter) is", () => {
        // tslint:disable-next-line:max-line-length
        it.each([true, false, null, [], 0, NaN, "", (): null => null, Symbol("test"), { baseUrl: null }])(
            "%p",
            (options: any) => {
                expect(() => SDK.init(options)).toThrow(ParameterValidationError);
            },
        );
    });

});

describe.each<[string, ReturnType<typeof SDK.init>, string]>([
    ["Default exported SDK", SDK, "https://api.digi.me/v1.0"],
    ["Custom SDK", customSDK, "https://api.digi.test/v7"],
])(
    "%s",
    (_title, sdk, baseUrl) => {

        describe("establishSession", () => {

            it(`Targets API with base url: ${baseUrl}/`, async () => {
                const callback = jest.fn();
                const scope = nock(`${baseUrl}`).post(new RegExp(`^/(.*)`)).reply(200);

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
                const defs = loadScopeDefinitions(
                    "fixtures/network/establish-session/valid-session.json",
                    `${new URL(`${baseUrl}`).origin}`,
                );

                nock.define(defs);

                const promise = sdk.establishSession("test-application-id", "test-contract-id");
                return expect(promise).resolves.toEqual(defs[0].response);
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

        describe("getAuthorizationUrl", () => {
            describe("Returns a Url where", () => {
                it.each<[string, string, (url: URL) => unknown]>([
                    ["Protocol", "digime:", (url) => url.protocol],
                    ["Host", "consent-access", (url) => url.host],
                    ["Query \"sessionKey\"", "test-session-key", (url) => url.searchParams.get("sessionKey")],
                    ["Query \"appId\"", "test-application-id", (url) => url.searchParams.get("appId")],
                    ["Query \"sdkVersion\"", sdkVersion, (url) => url.searchParams.get("sdkVersion")],
                    ["Query \"resultVersion\"", "2", (url) => url.searchParams.get("resultVersion")],
                    [
                        "Query \"callbackUrl\"",
                        "https://callback.test?a=1&b=2#c",
                        (url) => url.searchParams.get("callbackUrl"),
                    ],
                ])(
                    "%s is %p",
                    (_label, expected, getter) => {

                        const appUrl = sdk.getAuthorizeUrl(
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
            });

            describe("Throws ParameterValidationError when appId (first parameter) is", () => {
                it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                    "%p",
                    (appId: any) => {
                        const fn = () => sdk.getAuthorizeUrl(
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
                        const fn = () => sdk.getAuthorizeUrl(
                            "test-application-id",
                            session,
                            "https://callback.test?a=1&b=2#c",
                        );

                        expect(fn).toThrow(ParameterValidationError);
                    },
                );
            });

            describe("Throws ParameterValidationError when callbackUrl (third parameter) is", () => {
                it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                    "%p",
                    (callbackUrl: any) => {
                        const fn = () => sdk.getAuthorizeUrl(
                            "test-application-id",
                            {
                                expiry: 0,
                                sessionKey: "test-session-key",
                                sessionExchangeToken: "test-session-exchange-token",
                            },
                            callbackUrl,
                        );

                        expect(fn).toThrow(ParameterValidationError);
                    },
                );
            });

        });

        describe("getReceiptUrl", () => {
            describe("Returns a Url where", () => {
                it.each<[string, string, (url: URL) => unknown]>([
                    ["Protocol", "digime:", (url) => url.protocol],
                    ["Host", "receipt", (url) => url.host],
                    ["Query \"contractId\"", "test-contract-id", (url) => url.searchParams.get("contractId")],
                    ["Query \"appId\"", "test-application-id", (url) => url.searchParams.get("appId")],
                ])(
                    "%s is %p",
                    (_label, expected, getter) => {

                        const receiptUrl = sdk.getReceiptUrl(
                            "test-contract-id",
                            "test-application-id",
                        );

                        const actual = getter(new URL(receiptUrl));
                        expect(actual).toBe(expected);
                    },
                );
            });

            describe("Throws ParameterValidationError when contractid (first parameter) is", () => {
                it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                    "%p",
                    (contractid: any) => {
                        const fn = () => sdk.getReceiptUrl(
                            contractid,
                            "test-application-id",
                        );

                        expect(fn).toThrow(ParameterValidationError);
                    },
                );
            });

            describe("Throws ParameterValidationError when applicationId (second parameter) is", () => {
                // tslint:disable-next-line:max-line-length
                it.each([true, false, null, undefined, {}, { expiry: "0", sessionKey: 1 }, [], 0, NaN, "", (): null => null, Symbol("test")])(
                    "%p",
                    (applicationId: any) => {
                        const fn = () => sdk.getReceiptUrl(
                            "test-contract-id",
                            applicationId,
                        );

                        expect(fn).toThrow(ParameterValidationError);
                    },
                );
            });
        });

        describe("getGuestAuthorizationUrl", () => {
            describe("Returns a Url where", () => {
                it.each<[string, string, (url: URL) => unknown]>([
                    ["Protocol", "https:", (url) => url.protocol],
                    ["Host", `${new URL(baseUrl).host}`, (url) => url.host],
                    ["Pathname", `/apps/quark/direct-onboarding`, (url) => url.pathname],
                    [
                        "Query \"sessionExchangeToken\"",
                        "test-session-exchange-token",
                        (url) => url.searchParams.get("sessionExchangeToken"),
                    ],
                    [
                        "Query \"callbackUrl\"",
                        "https://callback.test?a=1&b=2#c",
                        (url) => url.searchParams.get("callbackUrl"),
                    ],
                ])(
                    "%s is %p",
                    (_label, expected, getter) => {

                        const appUrl = sdk.getGuestAuthorizeUrl(
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
            });

            describe("Throws ParameterValidationError when session (first parameter) is", () => {
                // tslint:disable-next-line:max-line-length
                it.each([true, false, null, undefined, {}, { expiry: "0", sessionKey: 1 }, [], 0, NaN, "", (): null => null, Symbol("test")])(
                    "%p",
                    (session: any) => {
                        const fn = () => sdk.getGuestAuthorizeUrl(
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
                    (callbackUrl: any) => {
                        const fn = () => sdk.getGuestAuthorizeUrl(
                            {
                                expiry: 0,
                                sessionKey: "test-session-key",
                                sessionExchangeToken: "test-session-exchange-token",
                            },
                            callbackUrl,
                        );

                        expect(fn).toThrow(ParameterValidationError);
                    },
                );
            });

        });

        describe("getSessionAccounts", () => {
            it(`Requests target API baseUrl: ${baseUrl}`, async () => {

                nock(`${new URL(baseUrl).origin}`)
                    .get(`${new URL(baseUrl).pathname}/permission-access/query/test-session-key/accounts.json`)
                    .reply(200, {
                        fileContent: {
                            accounts: [{
                                name: "test-account",
                            }],
                        },
                    });

                const result = await sdk.getSessionAccounts("test-session-key");

                expect(result).toEqual({
                    accounts: [{
                        name: "test-account",
                    }],
                });
            });

            describe("Throws ParameterValidationError when sessionKey (first parameter) is", () => {

                it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                    "%p",
                    (sessionKey: any) => {
                        return expect(sdk.getSessionAccounts(sessionKey)).rejects.toThrow(ParameterValidationError);
                    },
                );

            });
        });

        describe("getSessionData", () => {

            it(`Requests target API baseUrl: ${baseUrl}`, async () => {
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

                await sdk.getSessionData(
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
                        const promise = sdk.getSessionData(
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
                        `${new URL(baseUrl).origin}`,
                    );
                    nock.define(fileListDefs);

                    const fileList: string[] = (fileListDefs[0].response as Dictionary<any>).fileList;
                    const fileDefs = loadScopeDefinitions(
                        `fixtures/network/get-file/${file}`,
                        `${new URL(baseUrl).origin}`,
                    );

                    const caFormatted = await fileContentToCAFormat(
                        fileDefs,
                        testKeyPair,
                    );

                    nock.define(caFormatted);

                    const successCallback = jest.fn();

                    await sdk.getSessionData(
                        "test-session-key",
                        testKeyPair.exportKey("pkcs1-private-pem"),
                        successCallback,
                        () => null,
                    );

                    expect(successCallback).toHaveBeenCalledTimes(fileDefs.length);

                    fileDefs.forEach((fileDef) => {
                        expect(successCallback).toHaveBeenCalledWith(expect.objectContaining({
                            fileData: (fileDef.response as Dictionary<any>).fileContent,
                            fileName: basename(fileDef.path),
                            fileList,
                            fileDescriptor: (fileDef.response as Dictionary<any>).fileMetadata,
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
                            `${new URL(baseUrl).origin}`,
                        );
                        nock.define(fileListDefs);

                        const fileList: string[] = (fileListDefs[0].response as Dictionary<any>).fileList;

                        const fileDefs = loadScopeDefinitions(
                            `fixtures/network/get-file/${file}`,
                            `${new URL(baseUrl).origin}`,
                        );

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

                        await sdk.getSessionData(
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
