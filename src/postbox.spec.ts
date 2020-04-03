/*!
 * Copyright (c) 2009-2020 digi.me Limited. All rights reserved.
 */

import { HTTPError } from "got";
import nock = require("nock");
import NodeRSA from "node-rsa";
import { URL } from "url";
import * as SDK from "./";
import { TypeValidationError, SDKInvalidError, SDKVersionInvalidError } from "./errors";
import sdkVersion from "./sdk-version";

const customSDK = SDK.init({
    baseUrl: "https://api.digi.test/v7",
});

const testKeyPair: NodeRSA = new NodeRSA({ b: 2048 });

beforeEach(() => {
    nock.cleanAll();
});

describe.each<[string, ReturnType<typeof SDK.init>, string]>([
    ["Default exported SDK", SDK, "https://api.digi.me/v1.4"],
    ["Custom SDK", customSDK, "https://api.digi.test/v7"],
])(
    "%s",
    (_title, sdk, baseUrl) => {

    describe("getCreatePostboxUrl", () => {
        describe("Returns a Url where", () => {
            it.each<[string, string, (url: URL) => unknown]>([
                ["Protocol", "digime:", (url) => url.protocol],
                ["Host", "postbox", (url) => url.host],
                ["Pathname", "/create", (url) => url.pathname],
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

                    const appUrl = sdk.getCreatePostboxUrl(
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

        describe("Throws TypeValidationError when appId (first parameter) is", () => {
            it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                "%p",
                (appId: any) => {
                    const fn = () => sdk.getCreatePostboxUrl(
                        appId,
                        {
                            expiry: 0,
                            sessionKey: "test-session-key",
                            sessionExchangeToken: "test-session-exchange-token",
                        },
                        "https://callback.test?a=1&b=2#c",
                    );

                    expect(fn).toThrow(TypeValidationError);
                },
            );
        });

        describe("Throws TypeValidationError when session (second parameter) is", () => {
            // tslint:disable-next-line:max-line-length
            it.each([true, false, null, undefined, {}, { expiry: "0", sessionKey: 1 }, [], 0, NaN, "", (): null => null, Symbol("test")])(
                "%p",
                (session: any) => {
                    const fn = () => sdk.getCreatePostboxUrl(
                        "test-application-id",
                        session,
                        "https://callback.test?a=1&b=2#c",
                    );

                    expect(fn).toThrow(TypeValidationError);
                },
            );
        });

        describe("Throws TypeValidationError when callbackUrl (third parameter) is", () => {
            it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                "%p",
                (callbackUrl: any) => {
                    const fn = () => sdk.getCreatePostboxUrl(
                        "test-application-id",
                        {
                            expiry: 0,
                            sessionKey: "test-session-key",
                            sessionExchangeToken: "test-session-exchange-token",
                        },
                        callbackUrl,
                    );

                    expect(fn).toThrow(TypeValidationError);
                },
            );
        });
    });

    describe("getPostboxImportUrl", () => {
        describe("Returns a Url where", () => {
            it.each<[string, string, (url: URL) => unknown]>([
                ["Protocol", "digime:", (url) => url.protocol],
                ["Host", "postbox", (url) => url.host],
                ["Pathname", "/import", (url) => url.pathname],
            ])(
                "%s is %p",
                (_label, expected, getter) => {
                    const actual = getter(new URL(sdk.getPostboxImportUrl()));
                    expect(actual).toBe(expected);
                },
            );
        });
    });

    describe("pushToPostbox", () => {
        it(`Requests target API host and version: ${baseUrl}`, async () => {

            const callback = jest.fn();
            const scope = nock(`${new URL(baseUrl).origin}`)
                .post(`${new URL(baseUrl).pathname}/permission-access/postbox/test-postbox-id`)
                .reply(200);

            // Request event only fires when the scope target has been hit
            scope.on("request", callback);

            await sdk.pushDataToPostbox(
                "test-session-key",
                "test-postbox-id",
                testKeyPair.exportKey("pkcs1-public"),
                {
                    fileData: "test-data",
                    fileName: "file-name",
                    fileDescriptor: {
                        mimeType: "mimeType",
                        accounts: [],
                        reference: [],
                        tags: [],
                    },
                },
            );

            expect(callback).toHaveBeenCalledTimes(1);
        });

        describe("Throws TypeValidationError when sessionKey (first parameter) is", () => {
            it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                "%p",
                async (sessionKey: any) => {
                    const promise = sdk.pushDataToPostbox(
                        sessionKey,
                        "test-postbox-id",
                        testKeyPair.exportKey("pkcs1-public"),
                        {
                            fileData: "test-data",
                            fileName: "file-name",
                            fileDescriptor: {
                                mimeType: "mimeType",
                                accounts: [],
                                reference: [],
                                tags: [],
                            },
                        },
                    );

                    return expect(promise).rejects.toThrow(TypeValidationError);
                },
            );
        });

        describe("Throws TypeValidationError when postboxId (second parameter) is", () => {
            it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                "%p",
                async (postboxId: any) => {
                    const promise = sdk.pushDataToPostbox(
                        "test-session-key",
                        postboxId,
                        testKeyPair.exportKey("pkcs1-public"),
                        {
                            fileData: "test-data",
                            fileName: "file-name",
                            fileDescriptor: {
                                mimeType: "mimeType",
                                accounts: [],
                                reference: [],
                                tags: [],
                            },
                        },
                    );

                    return expect(promise).rejects.toThrow(TypeValidationError);
                },
            );
        });

        describe("Throws TypeValidationError when public key (third parameter) is", () => {
            it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                "%p",
                async (publicKey: any) => {
                    const promise = sdk.pushDataToPostbox(
                        "test-session-key",
                        "test-postbox-id",
                        publicKey,
                        {
                            fileData: "test-data",
                            fileName: "file-name",
                            fileDescriptor: {
                                mimeType: "mimeType",
                                accounts: [],
                                reference: [],
                                tags: [],
                            },
                        },
                    );

                    return expect(promise).rejects.toThrow(TypeValidationError);
                },
            );
        });

        describe(`Handles server side errors with endpoint ${baseUrl}`, () => {
            it("Throws HTTPError when we get an error from the call", async () => {
                const callback = jest.fn();
                const scope = nock(`${new URL(baseUrl).origin}`)
                    .post(`${new URL(baseUrl).pathname}/permission-access/postbox/test-postbox-id`)
                    .reply(404);

                // Request event only fires when the scope target has been hit
                scope.on("request", callback);

                const promise = sdk.pushDataToPostbox(
                    "test-session-key",
                    "test-postbox-id",
                    testKeyPair.exportKey("pkcs1-public"),
                    {
                        fileData: "test-data",
                        fileName: "file-name",
                        fileDescriptor: {
                            mimeType: "mimeType",
                            accounts: [],
                            reference: [],
                            tags: [],
                        },
                    },
                );

                return expect(promise).rejects.toThrow(HTTPError);
            });

            it("Throws SDKInvalid when we get an SDKInvalid message from the server", () => {

                nock(`${new URL(baseUrl).origin}`)
                    .post(`${new URL(baseUrl).pathname}/permission-access/postbox/test-postbox-id`)
                    .reply(404, {
                        error: {
                            code: "SDKInvalid",
                            message: "SDK Invalid errors",
                            reference: "3Wb9vDEsv4ODYKaoP6lQKCbZu9rnJ6UH",
                        },
                    });

                const promise = sdk.pushDataToPostbox(
                    "test-session-key",
                    "test-postbox-id",
                    testKeyPair.exportKey("pkcs1-public"),
                    {
                        fileData: "test-data",
                        fileName: "file-name",
                        fileDescriptor: {
                            mimeType: "mimeType",
                            accounts: [],
                            reference: [],
                            tags: [],
                        },
                    },
                );

                return expect(promise).rejects.toThrowError(SDKInvalidError);
            });

            it("Throws SDKVersionInvalid when we get an SDKVersionInvalid message from the server", () => {

                nock(`${new URL(baseUrl).origin}`)
                    .post(`${new URL(baseUrl).pathname}/permission-access/postbox/test-postbox-id`)
                    .reply(404, {
                        error: {
                            code: "SDKVersionInvalid",
                            message: "SDK Version Invalid errors",
                            reference: "3Wb9vDEsv4ODYKaoP6lQKCbZu9rnJ6UH",
                        },
                    });

                const promise = sdk.pushDataToPostbox(
                    "test-session-key",
                    "test-postbox-id",
                    testKeyPair.exportKey("pkcs1-public"),
                    {
                        fileData: "test-data",
                        fileName: "file-name",
                        fileDescriptor: {
                            mimeType: "mimeType",
                            accounts: [],
                            reference: [],
                            tags: [],
                        },
                    },
                );

                return expect(promise).rejects.toThrowError(SDKVersionInvalidError);
            });
        });
    });
});
