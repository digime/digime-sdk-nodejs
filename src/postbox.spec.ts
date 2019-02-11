/*!
 * Copyright (c) 2009-2018 digi.me Limited. All rights reserved.
 */

import { HTTPError } from "got";
import nock = require("nock");
import NodeRSA from "node-rsa";
import { URL } from "url";
import * as SDK from "./";
import { ParameterValidationError, SDKInvalidError, SDKVersionInvalidError } from "./errors";
import sdkVersion from "./sdk-version";

const customSDK = SDK.createSDK({
    host: "api.digi.test",
    version: "v7",
});

const testKeyPair: NodeRSA = new NodeRSA({ b: 2048 });

beforeEach(() => {
    nock.cleanAll();
});

describe.each<[string, ReturnType<typeof SDK.createSDK>, string, string]>([
    ["Default exported SDK", SDK, "api.digi.me", "v1.0"],
    ["Custom SDK", customSDK, "api.digi.test", "v7"],
])(
    "%s",
    (_title, sdk, host, version) => {

    describe("getPostboxURL", () => {
        describe("Returns a URL where", () => {
            it.each<[string, string, (url: URL) => unknown]>([
                ["Protocol", "digime:", (url) => url.protocol],
                ["Host", "postbox", (url) => url.host],
                ["Pathname", "/create", (url) => url.pathname],
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

                    const appUrl = sdk.getPostboxURL(
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
                    const fn = () => sdk.getPostboxURL(
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
                    const fn = () => sdk.getPostboxURL(
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
                    const fn = () => sdk.getPostboxURL(
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

    describe("getCompletionURL", () => {
        describe("Returns a URL where", () => {
            it.each<[string, string, (url: URL) => unknown]>([
                ["Protocol", "digime:", (url) => url.protocol],
                ["Host", "postbox", (url) => url.host],
                ["Pathname", "/push-complete", (url) => url.pathname],
                ["Query \"sessionKey\"", "test-session-key", (url) => url.searchParams.get("sessionKey")],
                ["Query \"postboxId\"", "test-postbox-id", (url) => url.searchParams.get("postboxId")],
                ["Query \"sdkVersion\"", sdkVersion, (url) => url.searchParams.get("sdkVersion")],
                [
                    "Query \"callbackURL\"",
                    "https://callback.test?a=1&b=2#c",
                    (url) => url.searchParams.get("callbackURL"),
                ],
            ])(
                "%s is %p",
                (_label, expected, getter) => {

                    const url = sdk.getPushCompleteURL(
                        "test-session-key",
                        "test-postbox-id",
                        "https://callback.test?a=1&b=2#c",
                    );

                    const actual = getter(new URL(url));
                    expect(actual).toBe(expected);
                },
            );
        });

        describe("Throws ParameterValidationError when session key (first parameter) is", () => {
            it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                "%p",
                (sessionKey: any) => {
                    const fn = () => sdk.getPushCompleteURL(
                        sessionKey,
                        "test-postbox-id",
                        "https://callback.test?a=1&b=2#c",
                    );

                    expect(fn).toThrow(ParameterValidationError);
                },
            );
        });

        describe("Throws ParameterValidationError when postbox id (second parameter) is", () => {
            it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                "%p",
                (postboxId: any) => {
                    const fn = () => sdk.getPushCompleteURL(
                        "test-session-key",
                        postboxId,
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
                    const fn = () => sdk.getPushCompleteURL(
                        "test-session-key",
                        "test-postbox-id",
                        callbackURL,
                    );

                    expect(fn).toThrow(ParameterValidationError);
                },
            );
        });
    });

    describe("pushToPostbox", () => {
        it(`Requests target API host and version: https://${host}/${version}/`, async () => {

            const callback = jest.fn();
            const scope = nock(`https://${host}`)
                .post(`/${version}/permission-access/postbox/test-postbox-id`)
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

        describe("Throws ParameterValidationError when sessionKey (first parameter) is", () => {
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

                    return expect(promise).rejects.toThrow(ParameterValidationError);
                },
            );
        });

        describe("Throws ParameterValidationError when postboxId (second parameter) is", () => {
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

                    return expect(promise).rejects.toThrow(ParameterValidationError);
                },
            );
        });

        describe("Throws ParameterValidationError when public key (third parameter) is", () => {
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

                    return expect(promise).rejects.toThrow(ParameterValidationError);
                },
            );
        });

        describe("Handles server side errors", () => {
            it("Throws HTTPError when we get an error from the call", async () => {
                const callback = jest.fn();
                const scope = nock(`https://${host}`)
                    .post(`/${version}/permission-access/postbox/test-postbox-id`)
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

                nock(`https://${host}`)
                    .post(`/${version}/permission-access/postbox/test-postbox-id`)
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

                nock(`https://${host}`)
                    .post(`/${version}/permission-access/postbox/test-postbox-id`)
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
