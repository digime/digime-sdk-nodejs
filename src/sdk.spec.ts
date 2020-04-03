/*!
 * Copyright (c) 2009-2020 digi.me Limited. All rights reserved.
 */

import { HTTPError } from "got";
import nock from "nock";
import NodeRSA from "node-rsa";
import { URL } from "url";
import { createCAData, loadDefinitions, loadScopeDefinitions, spyOnScopeRequests } from "../utils/test-utils";
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

    describe("Throws TypeValidationError when options (first parameter) is", () => {
        // tslint:disable-next-line:max-line-length
        it.each([true, false, null, [], 0, NaN, "", (): null => null, Symbol("test"), { baseUrl: null }])(
            "%p",
            (options: any) => {
                expect(() => SDK.init(options)).toThrow(TypeValidationError);
            },
        );
    });

});

describe.each<[string, ReturnType<typeof SDK.init>, string]>([
    ["Default exported SDK", SDK, "https://api.digi.me/v1.4"],
    ["Custom SDK", customSDK, "https://api.digi.test/v7"],
])(
    "%s",
    (_title, sdk, baseUrl) => {

        describe("establishSession", () => {

            it(`Targets API with base url: ${baseUrl}/`, async () => {

                const defs = loadScopeDefinitions(
                    "fixtures/network/establish-session/valid-session.json",
                    `${new URL(`${baseUrl}`).origin}`,
                );

                const requestSpy = spyOnScopeRequests(nock.define(defs));

                await sdk.establishSession("test-application-id", "test-contract-id");

                expect(requestSpy).toHaveBeenCalledTimes(1);
            });

            it("Sends a valid sdkAgent in body", async () => {

                const defs = loadScopeDefinitions(
                    "fixtures/network/establish-session/valid-session.json",
                    `${new URL(`${baseUrl}`).origin}`,
                );

                const requestSpy = spyOnScopeRequests(nock.define(defs));

                await sdk.establishSession("test-application-id", "test-contract-id");

                expect(requestSpy).toHaveBeenCalledTimes(1);
                expect(requestSpy).toHaveBeenCalledWith(
                    expect.objectContaining({
                        sdkAgent: expect.objectContaining({
                            name: expect.stringMatching("js"),
                            version: expect.stringMatching(sdkVersion),
                            meta: expect.objectContaining({
                                node: expect.stringMatching(process.version),
                            }),
                        }),
                    }),
                );
            });

            it("Sends appId in body", async () => {

                const defs = loadScopeDefinitions(
                    "fixtures/network/establish-session/valid-session.json",
                    `${new URL(`${baseUrl}`).origin}`,
                );

                const requestSpy = spyOnScopeRequests(nock.define(defs));

                await sdk.establishSession("test-application-id", "test-contract-id");

                expect(requestSpy).toHaveBeenCalledTimes(1);
                expect(requestSpy).toHaveBeenCalledWith(
                    expect.objectContaining({
                        appId: expect.stringMatching("test-application-id"),
                    }),
                );
            });

            it("Sends contractId in body", async () => {

                const defs = loadScopeDefinitions(
                    "fixtures/network/establish-session/valid-session.json",
                    `${new URL(`${baseUrl}`).origin}`,
                );

                const requestSpy = spyOnScopeRequests(nock.define(defs));

                await sdk.establishSession("test-application-id", "test-contract-id");

                expect(requestSpy).toHaveBeenCalledTimes(1);
                expect(requestSpy).toHaveBeenCalledWith(
                    expect.objectContaining({
                        contractId: expect.stringMatching("test-contract-id"),
                    }),
                );
            });

            it("Sends scope in body, when defined", async () => {

                const defs = loadScopeDefinitions(
                    "fixtures/network/establish-session/valid-session.json",
                    `${new URL(`${baseUrl}`).origin}`,
                );

                const requestSpy = spyOnScopeRequests(nock.define(defs));

                await sdk.establishSession(
                    "test-application-id",
                    "test-contract-id",
                    { timeRanges: [{ last: "1Y" }] },
                );

                expect(requestSpy).toHaveBeenCalledTimes(1);
                expect(requestSpy).toHaveBeenCalledWith(
                    expect.objectContaining({
                        scope: expect.objectContaining({
                            timeRanges: expect.arrayContaining([{ last: "1Y" }]),
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

            it("Throws if session sent in the response body is not of the correct format", async () => {
                const defs = loadScopeDefinitions(
                    "fixtures/network/establish-session/invalid-session-wrong-format.json",
                    `${new URL(`${baseUrl}`).origin}`,
                );

                nock.define(defs);

                const promise = sdk.establishSession("test-application-id", "test-contract-id");
                return expect(promise).rejects.toThrowError(TypeValidationError);
            });

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

            describe("Throws TypeValidationError when appId (first parameter) is", () => {
                it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                    "%p",
                    (appId: any) => {
                        nock.define(loadDefinitions("fixtures/network/establish-session/valid-session.json"));
                        const promise = sdk.establishSession(appId, "test-contract-id");
                        return expect(promise).rejects.toThrow(TypeValidationError);
                    },
                );
            });

            describe("Throws TypeValidationError when contractId (second parameter) is", () => {
                it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                    "%p",
                    (contractId: any) => {
                        nock.define(loadDefinitions("fixtures/network/establish-session/valid-session.json"));
                        const promise = sdk.establishSession("test-application-id", contractId);
                        return expect(promise).rejects.toThrow(TypeValidationError);
                    },
                );
            });

            describe("Handling SDK statuses from Argon", () => {
                it("Logs in the console when we receive sdk status", async () => {

                    const defs = loadScopeDefinitions(
                        "fixtures/network/establish-session/valid-session-sdk-deprecated.json",
                        `${new URL(`${baseUrl}`).origin}`,
                    );

                    nock.define(defs);

                    const spy: jest.SpyInstance = jest.spyOn(console, "warn").mockImplementation();

                    await sdk.establishSession("test-application-id", "test-contract-id");

                    // TODO: Check this out
                    expect(spy).toHaveBeenCalledTimes(1);
                    expect(spy).toBeCalledWith(`[digime-js-sdk@${sdkVersion}][deprecated] status-message-test`);

                    spy.mockRestore();

                });
            });

            // NOTE: Tests skipped as there is no runtime validation of the CA scope in the SDK yet
            describe.skip("Throws TypeValidationError when CA scope (third parameter) is", () => {
                it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                    "%p",
                    (caScope: any) => {
                        nock.define(loadDefinitions("fixtures/network/establish-session/valid-session.json"));
                        const promise = sdk.establishSession("test-application-id", "test-contract-id", caScope);
                        return expect(promise).rejects.toThrow(TypeValidationError);
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

            describe("Throws TypeValidationError when appId (first parameter) is", () => {
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

                        expect(fn).toThrow(TypeValidationError);
                    },
                );
            });

            describe("Throws TypeValidationError when session (second parameter) is", () => {
                // tslint:disable-next-line:max-line-length
                it.each([true, false, null, undefined, {}, { expiry: "0", sessionKey: 1 }, [], 0, NaN, "", (): null => null, Symbol("test")])(
                    "%p",
                    (session: any) => {
                        const fn = () => sdk.getAuthorizeUrl(
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
                        const fn = () => sdk.getAuthorizeUrl(
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

            describe("Throws TypeValidationError when contractid (first parameter) is", () => {
                it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                    "%p",
                    (contractid: any) => {
                        const fn = () => sdk.getReceiptUrl(
                            contractid,
                            "test-application-id",
                        );

                        expect(fn).toThrow(TypeValidationError);
                    },
                );
            });

            describe("Throws TypeValidationError when applicationId (second parameter) is", () => {
                // tslint:disable-next-line:max-line-length
                it.each([true, false, null, undefined, {}, { expiry: "0", sessionKey: 1 }, [], 0, NaN, "", (): null => null, Symbol("test")])(
                    "%p",
                    (applicationId: any) => {
                        const fn = () => sdk.getReceiptUrl(
                            "test-contract-id",
                            applicationId,
                        );

                        expect(fn).toThrow(TypeValidationError);
                    },
                );
            });
        });

        describe("getGuestAuthorizationUrl", () => {
            describe("Returns a Url where", () => {
                it.each<[string, string, (url: URL) => unknown]>([
                    ["Protocol", "https:", (url) => url.protocol],
                    ["Host", `${new URL(baseUrl).host}`, (url) => url.host],
                    ["Pathname", `/apps/quark/v1/direct-onboarding`, (url) => url.pathname],
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

            describe("Throws TypeValidationError when session (first parameter) is", () => {
                // tslint:disable-next-line:max-line-length
                it.each([true, false, null, undefined, {}, { expiry: "0", sessionKey: 1 }, [], 0, NaN, "", (): null => null, Symbol("test")])(
                    "%p",
                    (session: any) => {
                        const fn = () => sdk.getGuestAuthorizeUrl(
                            session,
                            "https://callback.test?a=1&b=2#c",
                        );

                        expect(fn).toThrow(TypeValidationError);
                    },
                );
            });

            describe("Throws TypeValidationError when callbackUrl (second parameter) is", () => {
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

                        expect(fn).toThrow(TypeValidationError);
                    },
                );
            });

        });

        describe("getSessionAccounts", () => {

            it(`Retrieves data correctly`, async () => {

                const expected = {
                    accounts: [{
                        id: "4_123456789",
                        name: "test",
                        service: {
                            logo: "https://domain.test/test.png",
                            name: "Instagram",
                        },
                    }],
                };

                const encryptedData = createCAData(testKeyPair, JSON.stringify(expected));

                nock(`${new URL(baseUrl).origin}`)
                    .get(`${new URL(baseUrl).pathname}/permission-access/query/test-session-key/accounts.json`)
                    .reply(200, {
                        fileContent: encryptedData,
                    });

                const result = await sdk.getSessionAccounts("test-session-key", testKeyPair.exportKey("pkcs1-private"));

                expect(result).toEqual(expected);
            });

            describe("Throws TypeValidationError when sessionKey (first parameter) is", () => {

                it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                    "%p",
                    (sessionKey: any) => {
                        // tslint:disable-next-line:max-line-length
                        return expect(sdk.getSessionAccounts(sessionKey, testKeyPair.exportKey("pkcs1-private"))).rejects.toThrow(TypeValidationError);
                    },
                );
            });

            describe("Throws appropriate exceptions when argon returns errors", () => {
                it("Re-throws HTTPErrors if it encounters one", () => {
                    nock.define(loadDefinitions("fixtures/network/get-session-accounts/bad-request.json"));
                    const promise = sdk.getSessionAccounts("test-session-key", testKeyPair.exportKey("pkcs1-private"));
                    return expect(promise).rejects.toThrowError(HTTPError);
                });

                it("Throws SDKInvalidError if the API responds with SDKInvalid in error.code", () => {
                    nock.define(loadDefinitions("fixtures/network/get-session-accounts/invalid-sdk.json"));
                    const promise = sdk.getSessionAccounts("test-session-key", testKeyPair.exportKey("pkcs1-private"));
                    return expect(promise).rejects.toThrowError(SDKInvalidError);
                });

                it("Throws SDKVersionInvalidError if the API responds with SDKVersionInvalid in error.code", () => {
                    nock.define(loadDefinitions("fixtures/network/get-session-accounts/invalid-sdk-version.json"));
                    const promise = sdk.getSessionAccounts("test-session-key", testKeyPair.exportKey("pkcs1-private"));
                    return expect(promise).rejects.toThrowError(SDKVersionInvalidError);
                });
            });
        });
    },
);
