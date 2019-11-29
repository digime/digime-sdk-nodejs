/*!
 * Copyright (c) 2009-2019 digi.me Limited. All rights reserved.
 */

import { HTTPError } from "got";
import nock from "nock";
import { URL } from "url";
import {
    captureNetworkRequest,
    loadDefinitions,
    loadScopeDefinitions,
} from "../utils/test-utils";
import * as SDK from "./";
import { ParameterValidationError, SDKInvalidError, SDKVersionInvalidError } from "./errors";
import sdkVersion from "./sdk-version";

const customSDK = SDK.init({
    baseUrl: "https://api.digi.test/v7",
});

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
    ["Default exported SDK", SDK, "https://api.digi.me/v1.4"],
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

            describe("Handling SDK statuses from Argon", () => {
                it("Logs in the console when we receive sdk status", async () => {
                    const spy: jest.SpyInstance = jest.spyOn(console, "warn").mockImplementation();
                    nock(`${new URL(baseUrl).origin}`)
                        .post(`${new URL(baseUrl).pathname}/permission-access/session`)
                        .reply(200, {
                            expiry: 0,
                            sessionKey: "test-session-key",
                        }, {
                            "x-digi-sdk-status": "deprecated",
                            "x-digi-sdk-status-message": "status-message-test",
                        });

                    await sdk.establishSession("test-application-id", "test-contract-id");
                    expect(spy).toHaveBeenCalledTimes(1);
                    expect(spy).toBeCalledWith(`[digime-js-sdk@${sdkVersion}][deprecated] status-message-test`);
                    spy.mockRestore();
                });
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
            const privateKey = `-----BEGIN RSA PRIVATE KEY-----
                MIIEpAIBAAKCAQEArMZMuQF9dWKwxdC544CMoLYwBXKtzqLqsA8DXFYelex3MRCu
                4ykIfl4PcfIWAKAwXygXBnXNnVGVJP+YPAH01Vx8ontX/y7mQ1IKjP8Iwp/4Gzu1
                sog6+Xj0/7Nz+7bGkxEv+rkUAdO/u76/ZM1ffB2LR7vEoJn3O2ONoU2kWpkYFj+d
                IgQuDeVu5XkO8fTmIx8z7K9q9twwOaTrraLLureD4T5UCpfJdjcqy1ltXtZMro/A
                rR7jH2NI+lgIts46fK9lYmFy/Yt3qlv3JCsRGiGE/1x1+OW6tZG/2SVTtUZD8Pk5
                bbCtWiFAftpZs/6AUkV4St9GAUzmqgzSjrkX8QIDAQABAoIBAQCCckHxGO/pVfcT
                k7EV1LPYj1WYd2pE7np1LRCjgZ4cIeooEGmKtytjhY7xwA7esBN1dOZViVIR6kvK
                IHSHMg7xnJ+5aZkZ4QYXY/T1WYT6tR71KNLZlcO5IZsRCCOUs/4fgcWQ7nXtnztO
                /AizieAC7KeBJIKjozuoClUfqWhiwZwH7K/+qz0SHe3VqfS/U9wrD23fC+Awlq8q
                iiV7203gDq/1p1I3T0Vqr0l1ZcW7AKSxBgHSlYshpxj+ySxiDtzQwZXfHWoIFU++
                YdgNeTRLbzZmjR3DcblYgJjSWxd8uH894281dNuzCH8hitgUIBN74WbpCVTVOWEU
                4VLlQS4FAoGBAPiXu1LAWhFG4j1RwQdUf77Gv1sHYVm7p2DhKd9FE4YLXLij3eEx
                LpcoTUq/dYrYq2xBZcrlhjjNimxMddU+gGl3l1j6s1jRw0TpHHLSmL2s9gpY5KNF
                dQ6TUUZou/AIr46wPTbT2aLiDy2bzk5JsCEotdIjcYj/rBWdnUP+DxcfAoGBALHs
                OgHG7vCFCucZN43hrMi1Vpt8kIxU+3nqkaMBK2KJbwXjGBxPhie2yTvJxjPhuX3K
                n4x9489E8ALQsP+OSSfXfvswP1+2nyqg6iNfRS1EX2CbaMAb4mLkyIvXm1ee06Ti
                7oKapZGzKJAht1uzcNicLhBQ7kziWM1fuE401z7vAoGAeM0K+2h7nB+s+w1KVuyJ
                80QTYwHQHdHhwWNJfLTNivrkgNkojjDfKhcskCE/1kv56W5SL+mfcuT22i/BpvFr
                Z1T1GAkjtAqi8E6zQ1zxWmK9YUPXPzwWaRHPkf59LWSbIySjaoxCGzPtGkW3WDXY
                wBRPXqFYn7FWh16DOLIx1RMCgYAkDv4Kkiimsi/tehzaMlx0KNwukuYwqqB0qudt
                I7WJONU5Wjbutec4cUEDTvdOWHbhWYlQTcs3nH8P8v+MK2gEHRZtDfAqE7baStZo
                6Mv6SpsR1y05ke0lobxLKx0eet/l0OAJtBHOH4MfAtZITWuXWr+zKtPA3TamGLof
                j3H4HQKBgQDy+SJmfe/51ly3Ljx/X4ZoQC1PZeXqC9d7bIzpkQQsEH0gWXucFh1O
                8oH4dQpNAv1BMsHIlFOVE2v1Qi0M6OYbtG+XE9SJULTImvBYsGe0uYtibWkRZEWg
                PCM5QZF21ONlznJNmnDdPSUJ5WdYUbIxtn6oiiLlpg0FSEcSmzbpaQ==
                -----END RSA PRIVATE KEY-----`;
            it(`Requests target API baseUrl: ${baseUrl}`, async () => {

                nock(`${new URL(baseUrl).origin}`)
                    .get(`${new URL(baseUrl).pathname}/permission-access/query/test-session-key/accounts.json`)
                    .reply(200, {
                        fileContent: "g4AoAv2+WczMgo3tH/hGIxjKtiYTNm8SQ3x0KmA8LTIsljPCsZnFwyGdyoEpSCYFQIYe8hsPfmiiFadrsNA9zPnH93+wrgoxD9DmeNm/us6wTotjypXe0JpTdbBgudWp44j+FSPlat9lt1pFIHL1PTUjp3xR0mSHHJpa+nYGZ9y6vDpt8UiQw2FuKeFYzMws4er+uri0ZI3VPAFto7d65s7BQ+miaU71VTRY6e/N2g5C55JyYWonk2zS/8e1SzL86GtDjlviT8NU7CSG3UZ+d/gglfzzFafbk8/vO4/NPH6jOx2NmtwDYOzR8+jbqcJWk/fz8qJVfKT/766b2uk5qtHWXmNtbN+F21bp7e0LO26B9CKhowXBYUAB9Z7pOEP5bSBXMUwR0Kv3zFIu7e1yuj2pif+DiGsxYxEQjxLf6bHq2lzRtqi3jXJGEq96IDGouJd5ulcGUKo+I2zjKQicne3hRXppRneMt4KNdKilDLX5AErSL2syc+eRjLzLpHmaAAtfw+LUEqRPIlpDng2rE+i/1n8T9CQepWgaYhh7gEd9ZgZzxx+8oxW2gb9Hj5EhN0c7bO2dxOsS0g2PB4SVti+M8iEWLck9VXXfIu5he5kLXXMUROxLD7ZCugQvmRwqWUDC6R//dvqn6oViY3ffJu9VdjJsuTTpMygf5jlyekuWh4VbAzJS703P8Q7bSpyDXZZpd8xW8kbIBBs2GqPPMrngWTSQBA+FVxwCTrMWM3Lg84rNMGAOVEJAMaVb8Dui",
                    });

                const result = await sdk.getSessionAccounts("test-session-key", privateKey);

                expect(result).toEqual({
                    accounts: [{
                        "id": "4_314667644",
                        "name": "selimovicz",
                        "service": {
                            "logo": "https://securedownloads.digi.me/static/development/discovery/services/instagram/icon75x75.png",
                            "name": "Instagram",
                        }
                    }],
                });
            });

            describe("Throws ParameterValidationError when sessionKey (first parameter) is", () => {

                it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                    "%p",
                    (sessionKey: any) => {
                        return expect(sdk.getSessionAccounts(sessionKey, privateKey)).rejects.toThrow(ParameterValidationError);
                    },
                );
            });

            describe("Throws appropriate exceptions when argon returns errors", () => {
                it("Re-throws HTTPErrors if it encounters one", () => {
                    nock.define(loadDefinitions("fixtures/network/get-session-accounts/bad-request.json"));
                    const promise = sdk.getSessionAccounts("test-session-key", privateKey);
                    return expect(promise).rejects.toThrowError(HTTPError);
                });

                it("Throws SDKInvalidError if the API responds with SDKInvalid in error.code", () => {
                    nock.define(loadDefinitions("fixtures/network/get-session-accounts/invalid-sdk.json"));
                    const promise = sdk.getSessionAccounts("test-session-key", privateKey);
                    return expect(promise).rejects.toThrowError(SDKInvalidError);
                });

                it("Throws SDKVersionInvalidError if the API responds with SDKVersionInvalid in error.code", () => {
                    nock.define(loadDefinitions("fixtures/network/get-session-accounts/invalid-sdk-version.json"));
                    const promise = sdk.getSessionAccounts("test-session-key", privateKey);
                    return expect(promise).rejects.toThrowError(SDKVersionInvalidError);
                });
            });
        });
    },
);
