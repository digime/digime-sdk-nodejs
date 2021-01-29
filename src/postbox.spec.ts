/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import { HTTPError } from "got";
import { sign } from "jsonwebtoken";
import nock = require("nock");
import { URL } from "url";
import * as SDK from "./";
import { TypeValidationError, SDKInvalidError, SDKVersionInvalidError } from "./errors";
import sdkVersion from "./sdk-version";
import { GetAuthorizationUrlResponse } from "./types";
import { defaultValidDataPush, testKeyPair, validFileMeta, invalidFileMeta } from "../fixtures/postbox/example-data-pushes";

const customSDK = SDK.init({
    baseUrl: "https://api.digi.test/v7",
});

beforeEach(() => {
    nock.cleanAll();
});

describe.each<[string, ReturnType<typeof SDK.init>, string]>([
    ["Default exported SDK", SDK, "https://api.digi.me/v1.5"],
    ["Custom SDK", customSDK, "https://api.digi.test/v7"],
])(
    "%s",
    (_title, sdk, baseUrl) => {

    describe("authorize.once.getCreatePostboxUrl", () => {
        describe("Returns a Url where", () => {
            it.each<[string, string, (url: URL) => unknown]>([
                ["Protocol", "digime:", (url) => url.protocol],
                ["Host", "postbox", (url) => url.host],
                ["Pathname", "/create", (url) => url.pathname],
                ["Query \"sessionKey\"", "test-session-key", (url) => url.searchParams.get("sessionKey")],
                ["Query \"appId\"", "test-application-id", (url) => url.searchParams.get("appId")],
                ["Query \"sdkVersion\"", sdkVersion, (url) => url.searchParams.get("sdkVersion")],
                [
                    "Query \"callbackUrl\"",
                    "https://callback.test?a=1&b=2#c",
                    (url) => url.searchParams.get("callbackUrl"),
                ],
            ])(
                "%s is %p",
                (_label, expected, getter) => {

                    const appUrl = sdk.authorize.once.getCreatePostboxUrl({
                        applicationId: "test-application-id",
                        session: {
                            expiry: 0,
                            sessionKey: "test-session-key",
                            sessionExchangeToken: "test-session-exchange-token",
                        },
                        callbackUrl: "https://callback.test?a=1&b=2#c",
                    });

                    const actual = getter(new URL(appUrl));
                    expect(actual).toBe(expected);
                },
            );
        });

        describe("Throws TypeValidationError when applicationId is", () => {
            it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                "%p",
                (applicationId: any) => {
                    const fn = () => sdk.authorize.once.getCreatePostboxUrl({
                        applicationId,
                        session: {
                            expiry: 0,
                            sessionKey: "test-session-key",
                            sessionExchangeToken: "test-session-exchange-token",
                        },
                        callbackUrl: "https://callback.test?a=1&b=2#c",
                    });

                    expect(fn).toThrow(TypeValidationError);
                },
            );
        });

        describe("Throws TypeValidationError when session is", () => {
            // tslint:disable-next-line:max-line-length
            it.each([true, false, null, undefined, {}, { expiry: "0", sessionKey: 1 }, [], 0, NaN, "", (): null => null, Symbol("test")])(
                "%p",
                (session: any) => {
                    const fn = () => sdk.authorize.once.getCreatePostboxUrl({
                        applicationId: "test-application-id",
                        session,
                        callbackUrl: "https://callback.test?a=1&b=2#c",
                    });

                    expect(fn).toThrow(TypeValidationError);
                },
            );
        });

        describe("Throws TypeValidationError when callbackUrl is", () => {
            it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                "%p",
                (callbackUrl: any) => {

                    const fn = () => sdk.authorize.once.getCreatePostboxUrl({
                        applicationId: "test-application-id",
                        session: {
                            expiry: 0,
                            sessionKey: "test-session-key",
                            sessionExchangeToken: "test-session-exchange-token",
                        },
                        callbackUrl,
                    });

                    expect(fn).toThrow(TypeValidationError);
                },
            );
        });
    });

    describe("authorise.ongoing.getCreatePostboxUrl", () => {
        const defaultInput = {
            applicationId: "test-application-id",
            contractId: "test-contract-id",
            session: {
                expiry: 0,
                sessionKey: "test-session-key",
                sessionExchangeToken: "test-session-exchange-token",
            },
            redirectUri: "test-redirect-uri",
            privateKey: testKeyPair.exportKey("pkcs1-private").toString(),
        }

        describe("Throws TypeValidationErrors", () => {
            const invalidInputs = [true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")];

            describe("When applicationId is", () => {
                it.each(invalidInputs)("%p", (applicationId: any) => {
                    expect(sdk.authorize.ongoing.getCreatePostboxUrl({
                        ...defaultInput,
                        applicationId,
                    })).rejects.toThrow(TypeValidationError);
                });
            });

            describe("When session is", () => {
                it.each(invalidInputs)("%p", (session: any) => {
                    expect(sdk.authorize.ongoing.getCreatePostboxUrl({
                        ...defaultInput,
                        session,
                    })).rejects.toThrow(TypeValidationError);
                });
            });

            describe("When contractId is", () => {
                it.each(invalidInputs)("%p", (contractId: any) => {
                    expect(sdk.authorize.ongoing.getCreatePostboxUrl({
                        ...defaultInput,
                        contractId,
                    })).rejects.toThrow(TypeValidationError);
                });
            });

            describe("When redirect uri is", () => {
                it.each(invalidInputs)("%p", (redirectUri: any) => {
                    expect(sdk.authorize.ongoing.getCreatePostboxUrl({
                        ...defaultInput,
                        redirectUri,
                    })).rejects.toThrow(TypeValidationError);
                });
            });
        });

        describe(`When passed in correct params`, () => {

            let response: GetAuthorizationUrlResponse;
            const authorizeCallback = jest.fn();
            const jkuCallback = jest.fn();

            beforeAll(async () => {
                const jwt: string = sign(
                    {
                        preauthorization_code: "test-preauth-code",
                    },
                    testKeyPair.exportKey("pkcs1-private-pem").toString(),
                    {
                        algorithm: "PS512",
                        noTimestamp: true,
                        header: {
                            jku: `${baseUrl}/test-jku-url`,
                            kid: "test-kid",
                        },
                    },
                );

                const authorizeScope = nock(`${new URL(baseUrl).origin}`)
                    .post(`${new URL(baseUrl).pathname}/oauth/authorize`)
                    .reply(201, {
                        token: jwt,
                    })

                const jkuScope = nock(`${new URL(baseUrl).origin}`)
                    .get(`${new URL(baseUrl).pathname}/test-jku-url`)
                    .reply(201, {
                        keys: [{
                            kid: "test-kid",
                            pem: testKeyPair.exportKey("pkcs1-public"),
                        }],
                    });

                // Request event only fires when the scope target has been hit
                authorizeScope.on("request", authorizeCallback);
                jkuScope.on("request", jkuCallback);

                response = await sdk.authorize.ongoing.getCreatePostboxUrl(defaultInput);
            });

            it("calls authorize endpoint once", () => {
                expect(authorizeCallback).toHaveBeenCalledTimes(1);
            });

            it("calls test jku endpoint once", () => {
                expect(jkuCallback).toHaveBeenCalledTimes(1);
            });

            it("returns an object with codeVerifier", () => {
                expect(response.codeVerifier).toBeDefined();
            });

            it("returns an object with digi.me deep link", () => {
                expect(response.url).toBeDefined();
            });
        });

        describe(`When receving a server side error`, () => {
            it("to throw an HTTPError when receving a server side error", () => {
                nock(`${new URL(baseUrl).origin}`)
                    .post(`${new URL(baseUrl).pathname}/oauth/authorize`)
                    .reply(404, {
                        error: {
                            code: "errorCode",
                            message: "errorMessage",
                        },
                    });

                return expect(sdk.authorize.ongoing.getCreatePostboxUrl(defaultInput))
                    .rejects.toThrow(HTTPError);
            });

            it("to throw an SDKInvalidError when SDK is invalid", () => {
                nock(`${new URL(baseUrl).origin}`)
                    .post(`${new URL(baseUrl).pathname}/oauth/authorize`)
                    .reply(404, {
                        error: {
                            code: "SDKInvalid",
                            message: "SDK Invalid errors",
                            reference: "3Wb9vDEsv4ODYKaoP6lQKCbZu9rnJ6UH",
                        },
                    });

                return expect(sdk.authorize.ongoing.getCreatePostboxUrl(defaultInput))
                    .rejects.toThrow(SDKInvalidError);
            });

            it("to throw an SDKVersionInvalidError when SDK version is invalid", () => {
                nock(`${new URL(baseUrl).origin}`)
                    .post(`${new URL(baseUrl).pathname}/oauth/authorize`)
                    .reply(404, {
                        error: {
                            code: "SDKVersionInvalid",
                            message: "SDK Version Invalid errors",
                            reference: "3Wb9vDEsv4ODYKaoP6lQKCbZu9rnJ6UH",
                        },
                    });

                return expect(sdk.authorize.ongoing.getCreatePostboxUrl(defaultInput))
                    .rejects.toThrow(SDKVersionInvalidError);
            });
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
                    const actual = getter(new URL(sdk.push.getPostboxImportUrl()));
                    expect(actual).toBe(expected);
                },
            );
        });
    });

    describe("push.pushToPostbox", () => {

        describe("Throws TypeValidationErrors", () => {
            const invalidInputs = [true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")];

            describe("When applicationId is", () => {
                it.each(invalidInputs)("%p", (applicationId: any) => {
                    expect(sdk.push.pushDataToPostbox({
                        ...defaultValidDataPush,
                        applicationId,
                    })).rejects.toThrow(TypeValidationError);
                });
            });

            describe("When sessionKey is", () => {
                it.each(invalidInputs)("%p", (sessionKey: any) => {
                    expect(sdk.push.pushDataToPostbox({
                        ...defaultValidDataPush,
                        sessionKey,
                    })).rejects.toThrow(TypeValidationError);
                });
            });

            describe("When contractId is", () => {
                it.each(invalidInputs)("%p", (contractId: any) => {
                    expect(sdk.push.pushDataToPostbox({
                        ...defaultValidDataPush,
                        contractId,
                    })).rejects.toThrow(TypeValidationError);
                });
            });

            describe("When postboxId is", () => {
                it.each(invalidInputs)("%p", (postboxId: any) => {
                    expect(sdk.push.pushDataToPostbox({
                        ...defaultValidDataPush,
                        postboxId,
                    })).rejects.toThrow(TypeValidationError);
                });
            });

            describe("When redirect uri is", () => {
                it.each(invalidInputs)("%p", (redirectUri: any) => {
                    expect(sdk.push.pushDataToPostbox({
                        ...defaultValidDataPush,
                        redirectUri,
                    })).rejects.toThrow(TypeValidationError);
                });
            });

            describe("When publicKey is", () => {
                it.each(invalidInputs)("%p", (publicKey: any) => {
                    expect(sdk.push.pushDataToPostbox({
                        ...defaultValidDataPush,
                        publicKey,
                    })).rejects.toThrow(TypeValidationError);
                });
            });

            describe("When privateKey is", () => {
                it.each(invalidInputs)("%p", (privateKey: any) => {
                    expect(sdk.push.pushDataToPostbox({
                        ...defaultValidDataPush,
                        privateKey,
                    })).rejects.toThrow(TypeValidationError);
                });
            });

            describe("When data is", () => {
                it.each(invalidInputs)("%p", (privateKey: any) => {
                    expect(sdk.push.pushDataToPostbox({
                        ...defaultValidDataPush,
                        privateKey,
                    })).rejects.toThrow(TypeValidationError);
                });
            });

            describe("When fileData is", () => {
                const invalidFileDataInput = [...invalidInputs, "non empty strings"]
                it.each(invalidFileDataInput)("%p", (fileData: any) => {
                    expect(sdk.push.pushDataToPostbox({
                        ...defaultValidDataPush,
                        data: {
                            ...defaultValidDataPush.data,
                            fileData,
                        },
                    })).rejects.toThrow(TypeValidationError);
                });
            });
        });

        describe("No errors are thrown when passed in valid", () => {
            it.each<[string, any]>([
                ["plain text", validFileMeta.PLAIN_TEXT],
                ["JSON file", validFileMeta.FILE_JSON],
                ["PDF file", validFileMeta.FILE_PDF],
                ["JPG file", validFileMeta.FILE_PDF],
            ])("%p", async (_label, data: any) => {

                nock(`${new URL(baseUrl).origin}`)
                    .post(`${new URL(baseUrl).pathname}/permission-access/postbox/test-postbox-id`)
                    .reply(200, {
                        status: "delivered",
                        expires: 200000,
                    });

                const response = await sdk.push.pushDataToPostbox({
                    ...defaultValidDataPush,
                    data,
                });

                expect(response).toEqual({
                    status: "delivered",
                    expires: 200000,
                });
            });
        });

        describe("Throws errors are thrown when file meta passed is invalid", () => {
            it.each<[string, any]>([
                ["with missing file descriptor", invalidFileMeta.MISSING_FILE_DESCRIPTOR],
                ["with data that is not a buffer", invalidFileMeta.NON_BUFFER_FILE_DATA],
                ["with data that is a base64 string", invalidFileMeta.BASE_64_FILE_DATA],
                ["with missing file name", invalidFileMeta.MISSING_FILE_NAME],
            ])("%p", async (_label, data: any) => {

                expect(sdk.push.pushDataToPostbox({
                    ...defaultValidDataPush,
                    data,
                })).rejects.toThrow(TypeValidationError);
            });
        });

        describe("When given valid input", () => {
            it(`Requests target API host and version: ${baseUrl}`, async () => {

                const callback = jest.fn();
                const scope = nock(`${new URL(baseUrl).origin}`)
                    .post(`${new URL(baseUrl).pathname}/permission-access/postbox/test-postbox-id`)
                    .reply(200, {
                        status: "delivered",
                        expires: 200000,
                    });

                // Request event only fires when the scope target has been hit
                scope.on("request", callback);

                await sdk.push.pushDataToPostbox({
                    ...defaultValidDataPush,
                });

                expect(callback).toHaveBeenCalledTimes(1);
            });

            it(`Returns push status in the response`, async () => {
                nock(`${new URL(baseUrl).origin}`)
                    .post(`${new URL(baseUrl).pathname}/permission-access/postbox/${defaultValidDataPush.postboxId}`)
                    .reply(200, {
                        status: "delivered",
                        expires: 200000,
                    });

                const response = await sdk.push.pushDataToPostbox(defaultValidDataPush);

                expect(response).toEqual({
                    status: "delivered",
                    expires: 200000,
                });
            });

            it(`If no user access token is pushed up, pending status is returned in the response`, async () => {
                nock(`${new URL(baseUrl).origin}`)
                    .post(`${new URL(baseUrl).pathname}/permission-access/postbox/${defaultValidDataPush.postboxId}`)
                    .reply(200, {
                        status: "pending",
                        expires: 200000,
                    });

                const response = await sdk.push.pushDataToPostbox(defaultValidDataPush);

                expect(response).toEqual({
                    status: "pending",
                    expires: 200000,
                });
            });

            describe(`If user access token is included, pending status will trigger a refresh attempt`, () => {

                const refreshCallback = jest.fn();
                const jkuCallback = jest.fn();
                const pushCallback = jest.fn();
                let response: unknown;

                beforeAll(async () => {
                    const pushScope = nock(`${new URL(baseUrl).origin}`)
                        .post(`${new URL(baseUrl).pathname}/permission-access/postbox/${defaultValidDataPush.postboxId}`)
                        .reply(200, {
                            status: "pending",
                            expires: 200000,
                        })
                        .post(`${new URL(baseUrl).pathname}/permission-access/postbox/${defaultValidDataPush.postboxId}`)
                        .reply(200, {
                            status: "delivered",
                            expires: 200000,
                        });;

                    const jwt: string = sign(
                        {
                            access_token: `refreshed-test-access-token`,
                            refresh_token: `refreshed-test-refresh-token`,
                            expires_on: 2000000, // Test expiry timestamp
                        },
                        testKeyPair.exportKey("pkcs1-private-pem"),
                        {
                            algorithm: "PS512",
                            noTimestamp: true,
                            header: {
                                jku: `${baseUrl}/test-jku-url`,
                                kid: "test-kid",
                            },
                        },
                    );

                    const refreshScope = nock(`${new URL(baseUrl).origin}`)
                        .post(`${new URL(baseUrl).pathname}/oauth/token`)
                        .reply(201, {
                            token: jwt,
                        });

                    const verifyJKUScope = nock(`${new URL(baseUrl).origin}`)
                        .get(`${new URL(baseUrl).pathname}/test-jku-url`)
                        .reply(201, {
                            keys: [{
                                kid: "test-kid",
                                pem: testKeyPair.exportKey("pkcs1-public"),
                            }],
                        });

                    pushScope.on("request", pushCallback);
                    refreshScope.on("request", refreshCallback);
                    verifyJKUScope.on("request", jkuCallback);

                    response = await sdk.push.pushDataToPostbox({
                        ...defaultValidDataPush,
                        userAccessToken: {
                            accessToken: "test-access-token",
                            refreshToken: "test-refresh-token",
                            expiry: 100000,
                        },
                    });
                });

                it(`Refresh endpoint is called`, async () => {
                    expect(refreshCallback).toHaveBeenCalledTimes(1);
                });

                it(`Push endpoint is called twice`, async () => {
                    expect(pushCallback).toHaveBeenCalledTimes(2);
                });

                it(`jku verification endpoint is called`, async () => {
                    expect(jkuCallback).toHaveBeenCalledTimes(1);
                });

                it(`Returns push status and new user tokens in the response`, async () => {
                    expect(response).toEqual({
                        status: "delivered",
                        expires: 200000,
                        updatedAccessToken: {
                            accessToken: `refreshed-test-access-token`,
                            refreshToken: `refreshed-test-refresh-token`,
                            expiry: 2000000,
                        },
                    });
                });
            });
        });

        describe(`Handles server side errors with endpoint ${baseUrl}`, () => {
            it("Throws HTTPError when we get an error from the call", async () => {
                const callback = jest.fn();
                const scope = nock(`${new URL(baseUrl).origin}`)
                    .post(`${new URL(baseUrl).pathname}/permission-access/postbox/test-postbox-id`)
                    .reply(404);

                // Request event only fires when the scope target has been hit
                scope.on("request", callback);

                const promise = sdk.push.pushDataToPostbox({
                    applicationId: "test-application-id",
                    contractId: "test-contract-id",
                    redirectUri: "test-redirect-uri",
                    sessionKey: "test-session-key",
                    postboxId: "test-postbox-id",
                    publicKey: testKeyPair.exportKey("pkcs1-public"),
                    data: {
                        fileData: Buffer.from(JSON.stringify("test-data")),
                        fileName: "file-name",
                        fileDescriptor: {
                            mimeType: "mimeType",
                            accounts: [],
                            reference: [],
                            tags: [],
                        },
                    },
                    privateKey: testKeyPair.exportKey("pkcs1-private"),
                });

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

                const promise = sdk.push.pushDataToPostbox({
                    applicationId: "test-application-id",
                    contractId: "test-contract-id",
                    redirectUri: "test-redirect-uri",
                    sessionKey: "test-session-key",
                    postboxId: "test-postbox-id",
                    publicKey: testKeyPair.exportKey("pkcs1-public"),
                    data: {
                        fileData: Buffer.from(JSON.stringify("test-data")),
                        fileName: "file-name",
                        fileDescriptor: {
                            mimeType: "mimeType",
                            accounts: [],
                            reference: [],
                            tags: [],
                        },
                    },
                    privateKey: testKeyPair.exportKey("pkcs1-private"),
                });

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

                const promise = sdk.push.pushDataToPostbox({
                    applicationId: "test-application-id",
                    contractId: "test-contract-id",
                    redirectUri: "test-redirect-uri",
                    sessionKey: "test-session-key",
                    postboxId: "test-postbox-id",
                    publicKey: testKeyPair.exportKey("pkcs1-public"),
                    data: {
                        fileData: Buffer.from(JSON.stringify("test-data")),
                        fileName: "file-name",
                        fileDescriptor: {
                            mimeType: "mimeType",
                            accounts: [],
                            reference: [],
                            tags: [],
                        },
                    },
                    privateKey: testKeyPair.exportKey("pkcs1-private"),
                });

                return expect(promise).rejects.toThrowError(SDKVersionInvalidError);
            });
        });
    });
});
