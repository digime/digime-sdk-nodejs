/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import { HTTPError } from "got";
import { sign } from "jsonwebtoken";
import nock from "nock";
import NodeRSA from "node-rsa";
import { URL } from "url";
import * as SDK from ".";
import { JWTVerificationError, TypeValidationError, SDKInvalidError, SDKVersionInvalidError } from "./errors";
import { GetAuthorizationUrlResponse, UserAccessToken, UserLibraryAccessResponse } from "./types";

jest.mock("./sleep");

const customSDK = SDK.init({
    baseUrl: "https://api.digi.test/v7",
});

const testKeyPair: NodeRSA = new NodeRSA({ b: 2048 });

beforeEach(() => {
    nock.cleanAll();
});

describe.each<[string, ReturnType<typeof SDK.init>, string]>([
    ["Default exported SDK", SDK, "https://api.digi.me/v1.5"],
    ["Custom SDK", customSDK, "https://api.digi.test/v7"],
])(
    "%s",
    (_title, sdk, baseUrl) => {

        describe(`Getting an authorization url for ongoing private share`, () => {
            describe("Throws TypeValidationError when applicationId is ", () => {
                it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                    "%p",
                    async (applicationId: any) => {
                        const promise = sdk.authorize.ongoing.getPrivateShareConsentUrl({
                            applicationId,
                            contractId: "test-contract-id",
                            privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
                            redirectUri: "test-redirect-uri",
                            session: {
                                expiry: 0,
                                sessionKey: "test-session-key",
                                sessionExchangeToken: "test-session-exchange-token",
                            },
                        });

                        return expect(promise).rejects.toThrowError(TypeValidationError);
                    },
                );
            });

            describe("Throws TypeValidationError when contractId is ", () => {
                it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                    "%p",
                    async (contractId: any) => {
                        const promise = sdk.authorize.ongoing.getPrivateShareConsentUrl({
                            applicationId: "test-application-id",
                            contractId,
                            privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
                            redirectUri: "test-redirect-uri",
                            session: {
                                expiry: 0,
                                sessionKey: "test-session-key",
                                sessionExchangeToken: "test-session-exchange-token",
                            },
                        });

                        return expect(promise).rejects.toThrowError(TypeValidationError);
                    },
                );
            });

            describe("Throws TypeValidationError when redirectUri is ", () => {
                it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                    "%p",
                    async (redirectUri: any) => {
                        const promise = sdk.authorize.ongoing.getPrivateShareConsentUrl({
                            applicationId: "test-application-id",
                            contractId: "test-contract-id",
                            privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
                            redirectUri,
                            session: {
                                expiry: 0,
                                sessionKey: "test-session-key",
                                sessionExchangeToken: "test-session-exchange-token",
                            },
                        });

                        return expect(promise).rejects.toThrowError(TypeValidationError);
                    },
                );
            });

            it("Throws SDKInvalidError correctly", async () => {
                nock(`${new URL(baseUrl).origin}`)
                .post(`${new URL(baseUrl).pathname}/oauth/authorize`)
                .reply(404, {
                    error: {
                        code: "SDKInvalid",
                        message: "SDK Invalid errors",
                        reference: "3Wb9vDEsv4ODYKaoP6lQKCbZu9rnJ6UH",
                    },
                });

                const promise = sdk.authorize.ongoing.getPrivateShareConsentUrl({
                    applicationId: "test-application-id",
                    contractId: "test-contract-id",
                    privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
                    redirectUri: "test-redirect-uri",
                    session: {
                        expiry: 0,
                        sessionKey: "test-session-key",
                        sessionExchangeToken: "test-session-exchange-token",
                    },
                });

                return expect(promise).rejects.toThrowError(SDKInvalidError);
            });

            it("Throws SDKVersionInvalid correctly", async () => {
                nock(`${new URL(baseUrl).origin}`)
                .post(`${new URL(baseUrl).pathname}/oauth/authorize`)
                .reply(404, {
                    error: {
                        code: "SDKVersionInvalid",
                        message: "SDK Version Invalid errors",
                        reference: "3Wb9vDEsv4ODYKaoP6lQKCbZu9rnJ6UH",
                    },
                });

                const promise = sdk.authorize.ongoing.getPrivateShareConsentUrl({
                    applicationId: "test-application-id",
                    contractId: "test-contract-id",
                    privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
                    redirectUri: "test-redirect-uri",
                    session: {
                        expiry: 0,
                        sessionKey: "test-session-key",
                        sessionExchangeToken: "test-session-exchange-token",
                    },
                });

                return expect(promise).rejects.toThrowError(SDKVersionInvalidError);
            });

            it(`Throws JWT errors correctly`, () => {
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
                            kid: "unfound-kid",
                        },
                    },
                );

                nock(`${new URL(baseUrl).origin}`)
                    .post(`${new URL(baseUrl).pathname}/oauth/authorize`)
                    .reply(201, {
                        token: jwt,
                    })
                    .get(`${new URL(baseUrl).pathname}/test-jku-url`)
                    .reply(201, {
                        keys: [{
                            kid: "test-kid",
                            pem: testKeyPair.exportKey("pkcs1-public"),
                        }],
                    });

                const promise = sdk.authorize.ongoing.getPrivateShareConsentUrl({
                    applicationId: "test-application-id",
                    contractId: "test-contract-id",
                    privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
                    redirectUri: "test-redirect-uri",
                    session: {
                        expiry: 0,
                        sessionKey: "test-session-key",
                        sessionExchangeToken: "test-session-exchange-token",
                    },
                });

                return expect(promise).rejects.toThrowError(JWTVerificationError);
            });

            it("Throws other unexpected errors correctly", async () => {
                nock(`${new URL(baseUrl).origin}`)
                .post(`${new URL(baseUrl).pathname}/oauth/authorize`)
                .reply(404, {
                    error: {
                        code: "UnrecognisedError",
                        message: "Not an error we expected",
                        reference: "3Wb9vDEsv4ODYKaoP6lQKCbZu9rnJ6UH",
                    },
                });

                const promise = sdk.authorize.ongoing.getPrivateShareConsentUrl({
                    applicationId: "test-application-id",
                    contractId: "test-contract-id",
                    privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
                    redirectUri: "test-redirect-uri",
                    session: {
                        expiry: 0,
                        sessionKey: "test-session-key",
                        sessionExchangeToken: "test-session-exchange-token",
                    },
                });

                return expect(promise).rejects.toThrowError(HTTPError);
            });
        });

        describe(`Getting an authorization url for ongoing private share`, () => {

            let response: GetAuthorizationUrlResponse;
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

                nock(`${new URL(baseUrl).origin}`)
                    .post(`${new URL(baseUrl).pathname}/oauth/authorize`)
                    .reply(201, {
                        token: jwt,
                    })
                    .get(`${new URL(baseUrl).pathname}/test-jku-url`)
                    .reply(201, {
                        keys: [{
                            kid: "test-kid",
                            pem: testKeyPair.exportKey("pkcs1-public"),
                        }],
                    });

                response = await sdk.authorize.ongoing.getPrivateShareConsentUrl({
                    applicationId: "test-application-id",
                    contractId: "test-contract-id",
                    privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
                    redirectUri: "test-redirect-uri",
                    session: {
                        expiry: 0,
                        sessionKey: "test-session-key",
                        sessionExchangeToken: "test-session-exchange-token",
                    },
                });
            });

            it("returns an object with codeVerifier", () => {
                expect(response.codeVerifier).toBeDefined();
            });

            it("returns an object with digi.me deep link", () => {
                expect(response.url).toBeDefined();
            });
        });

        describe(`Calling prepareFilesUsingAccessToken with a valid auth token`, () => {
            let response: UserLibraryAccessResponse;
            const dataTriggerCall = jest.fn();

            beforeAll(async () => {
                const scope = nock(`${new URL(baseUrl).origin}`)
                    .post(`${new URL(baseUrl).pathname}/permission-access/trigger`)
                    .reply(202)
                ;

                // Request event only fires when the scope target has been hit
                scope.on("request", dataTriggerCall);

                response = await sdk.pull.prepareFilesUsingAccessToken({
                    applicationId: "test-application-id",
                    contractId: "test-contract-id",
                    privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
                    redirectUri: "test-redirect-uri",
                    session: {
                        expiry: 0,
                        sessionKey: "test-session-key",
                        sessionExchangeToken: "test-session-exchange-token",
                    },
                    userAccessToken: {
                        accessToken: "test-access-token",
                        refreshToken: "refresh-token",
                        expiry: 10000,
                    },
                });
            });

            it("returns an object with success to be true", () => {
                expect(response.success).toBe(true);
            });

            it("returns an undefined user access token", () => {
                const {updatedAccessToken} = response;
                expect(updatedAccessToken).toBeUndefined();
            });

            it("triggers the data trigger query", () => {
                expect(dataTriggerCall).toHaveBeenCalled();
            });
        });

        describe(`Calling prepareFilesUsingAccessToken with an invalid auth token`, () => {
            let response: UserLibraryAccessResponse;
            const dataTriggerCall = jest.fn();
            const refreshCall = jest.fn();

            beforeAll(async () => {
                const jwt: string = sign(
                    {
                        access_token: `refreshed-test-access-token`,
                        refresh_token: `refreshed-test-refresh-token`,
                        expires_on: 2000000, // Test expiry timestamp
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

                const triggerScope = nock(`${new URL(baseUrl).origin}`)
                    .post(`${new URL(baseUrl).pathname}/permission-access/trigger`)
                    .reply(401, {
                        error: {
                            code: "InvalidToken",
                            message: "The token (${tokenType}) is invalid",
                        },
                    });

                const refreshScope = nock(`${new URL(baseUrl).origin}`)
                    .post(`${new URL(baseUrl).pathname}/oauth/token`)
                    .reply(201, {
                        token: jwt,
                    })
                    .get(`${new URL(baseUrl).pathname}/test-jku-url`)
                    .reply(201, {
                        keys: [{
                            kid: "test-kid",
                            pem: testKeyPair.exportKey("pkcs1-public"),
                        }],
                    })
                    .post(`${new URL(baseUrl).pathname}/permission-access/trigger`)
                    .reply(202);

                // Request event only fires when the scope target has been hit
                triggerScope.on("request", dataTriggerCall);
                refreshScope.on("request", refreshCall);

                response = await sdk.pull.prepareFilesUsingAccessToken({
                    applicationId: "test-application-id",
                    contractId: "test-contract-id",
                    privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
                    redirectUri: "test-redirect-uri",
                    session: {
                        expiry: 0,
                        sessionKey: "test-session-key",
                        sessionExchangeToken: "test-session-exchange-token",
                    },
                    userAccessToken: {
                        accessToken: "test-access-token",
                        refreshToken: "refresh-token",
                        expiry: 10000,
                    },
                });
            });

            it("triggers the data trigger query", () => {
                expect(dataTriggerCall).toHaveBeenCalled();
            });

            it("triggers the refresh token query", () => {
                expect(refreshCall).toHaveBeenCalled();
            });

            it("returns the refreshed UserToken token", () => {
                const {updatedAccessToken} = response;

                expect(updatedAccessToken).toBeDefined();

                if(!updatedAccessToken){
                    return;
                }

                const {accessToken, refreshToken, expiry} = updatedAccessToken;
                expect(accessToken).toBe("refreshed-test-access-token");
                expect(refreshToken).toBe("refreshed-test-refresh-token");
                expect(expiry).toBe(2000000);
            });

            it("returns an object with success to be true", () => {
                expect(response.success).toBe(true);
            });
        });

        describe(`prepareFilesUsingAccessToken returns fail if refresh fails`, () => {
            let response: UserLibraryAccessResponse;
            beforeAll(async () => {
                const jwt: string = sign(
                    {
                        access_token: `refreshed-test-access-token`,
                        refresh_token: `refreshed-test-refresh-token`,
                        expires_on: 2000000, // Test expiry timestamp
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

                nock(`${new URL(baseUrl).origin}`)
                    .post(`${new URL(baseUrl).pathname}/permission-access/trigger`)
                    .reply(401, {
                        error: {
                            code: "InvalidToken",
                            message: "The token (${tokenType}) is invalid",
                        },
                    })
                    .post(`${new URL(baseUrl).pathname}/oauth/token`)
                    .reply(401, {
                        error: {
                            code: "InvalidToken",
                            message: "The token (${tokenType}) is invalid",
                        },
                    })
                    .post(`${new URL(baseUrl).pathname}/oauth/authorize`)
                    .reply(201, {
                        token: jwt,
                    })
                    .get(`${new URL(baseUrl).pathname}/test-jku-url`)
                    .reply(201, {
                        keys: [{
                            kid: "test-kid",
                            pem: testKeyPair.exportKey("pkcs1-public"),
                        }],
                    });

                response = await sdk.pull.prepareFilesUsingAccessToken({
                    applicationId: "test-application-id",
                    contractId: "test-contract-id",
                    privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
                    redirectUri: "test-redirect-uri",
                    session: {
                        expiry: 0,
                        sessionKey: "test-session-key",
                        sessionExchangeToken: "test-session-exchange-token",
                    },
                    userAccessToken: {
                        accessToken: "test-access-token",
                        refreshToken: "refresh-token",
                        expiry: 10000,
                    },
                });
            });

            it("returns an object with dataAuthorized to be false", () => {
                expect(response.success).toBe(false);
            });
        });

        describe(`exchangeCodeForToken throws errors `, () => {
            describe("Throws TypeValidationError when applicationId is ", () => {
                it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                    "%p",
                    async (applicationId: any) => {
                        const promise = sdk.authorize.exchangeCodeForToken({
                            applicationId,
                            contractId: "test-contract-id",
                            privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
                            redirectUri: "test-redirect-uri",
                            authorizationCode: "test-token",
                            codeVerifier: "test-code-verifier",
                        });

                        return expect(promise).rejects.toThrowError(TypeValidationError);
                    },
                );
            });
            describe("Throws TypeValidationError when contractId is ", () => {
                it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                    "%p",
                    async (contractId: any) => {
                        const promise = sdk.authorize.exchangeCodeForToken({
                            applicationId: "test-application-id",
                            contractId,
                            privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
                            redirectUri: "test-redirect-uri",
                            authorizationCode: "test-token",
                            codeVerifier: "test-code-verifier",
                        });

                        return expect(promise).rejects.toThrowError(TypeValidationError);
                    },
                );
            });
            describe("Throws TypeValidationError when redirectUri is ", () => {
                it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                    "%p",
                    async (redirectUri: any) => {
                        const promise = sdk.authorize.exchangeCodeForToken({
                            applicationId: "test-application-id",
                            contractId: "test-contract-id",
                            privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
                            redirectUri,
                            authorizationCode: "test-token",
                            codeVerifier: "test-code-verifier",
                        });

                        return expect(promise).rejects.toThrowError(TypeValidationError);
                    },
                );
            });
            describe("Throws TypeValidationError when code verifier is ", () => {
                it.each([true, false, null, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                    "%p",
                    async (codeVerifier: any) => {
                        const promise = sdk.authorize.exchangeCodeForToken({
                            applicationId: "test-application-id",
                            contractId: "test-contract-id",
                            privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
                            redirectUri: "test-redirect-uri",
                            authorizationCode: "test-token",
                            codeVerifier,
                        });

                        return expect(promise).rejects.toThrowError(TypeValidationError);
                    },
                );
            });

            describe("Throws TypeValidationError when token is ", () => {
                it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                    "%p",
                    async (authorizationCode: any) => {
                        const promise = sdk.authorize.exchangeCodeForToken({
                            applicationId: "test-application-id",
                            contractId: "test-contract-id",
                            privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
                            redirectUri: "test-redirect-uri",
                            authorizationCode,
                            codeVerifier: "test-code-verifier",
                        });

                        return expect(promise).rejects.toThrowError(TypeValidationError);
                    },
                );
            });
        });

        describe.each<[string, string | undefined]>([
            ["When code verifier passed in", "test-code-verifier"],
            ["When no code verifier is passed in", undefined],
        ])(
            "%s",
            (_description, codeVerifier) => {

            describe(`exchangeCodeForToken returns successfully`, () => {
                let token: UserAccessToken;

                beforeAll(async () => {
                    const jwt: string = sign(
                        {
                            access_token: `test-access-token`,
                            refresh_token: `test-refresh-token`,
                            expires_on: 1000000, // Test expiry timestamp
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

                    nock(`${new URL(baseUrl).origin}`)
                        .post(`${new URL(baseUrl).pathname}/oauth/token`)
                        .reply(201, {
                            token: jwt,
                        })
                        .get(`${new URL(baseUrl).pathname}/test-jku-url`)
                        .reply(201, {
                            keys: [{
                                kid: "test-kid",
                                pem: testKeyPair.exportKey("pkcs1-public"),
                            }],
                        });

                    token = await sdk.authorize.exchangeCodeForToken({
                        applicationId: "test-application-id",
                        contractId: "test-contract-id",
                        privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
                        redirectUri: "test-redirect-uri",
                        authorizationCode: "token",
                        codeVerifier,
                    });
                });

                it("returns an object with the correct accessToken", () => {
                    expect(token.accessToken).toBeDefined();
                    expect(token.accessToken).toBe("test-access-token");
                });

                it("returns an object with the correct refreshToken", () => {
                    expect(token.refreshToken).toBeDefined();
                    expect(token.refreshToken).toBe("test-refresh-token");
                });

                it("returns an object with the correct expiry", () => {
                    expect(token.expiry).toBeDefined();
                    expect(token.expiry).toBe(1000000);
                });
            });

        });
    },
);
