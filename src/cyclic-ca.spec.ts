/*!
 * Copyright (c) 2009-2020 digi.me Limited. All rights reserved.
 */

import { HTTPError } from "got";
import { sign } from "jsonwebtoken";
import nock from "nock";
import NodeRSA from "node-rsa";
import { URL } from "url";
import * as SDK from "./";
import { AuthorizeOngoingAccessResponse } from "./cyclic-ca";
import { JWTVerificationError, TypeValidationError, SDKInvalidError, SDKVersionInvalidError } from "./errors";
import { UserAccessToken } from "./types";

jest.mock("./sleep");

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

        describe(`AuthorizeOngoingAccess throws errors `, () => {
            describe("Throws TypeValidationError when applicationId is ", () => {
                it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                    "%p",
                    async (applicationId: any) => {
                        const promise = sdk.authorizeOngoingAccess(
                            {
                                applicationId,
                                contractId: "test-contract-id",
                                privateKey: testKeyPair.exportKey("pkcs1-private-pem"),
                                redirectUri: "test-redirect-uri",
                            } as any,
                            {
                                expiry: 0,
                                sessionKey: "test-session-key",
                                sessionExchangeToken: "test-session-exchange-token",
                            },
                        );

                        return expect(promise).rejects.toThrowError(TypeValidationError);
                    },
                );
            });

            describe("Throws TypeValidationError when contractId is ", () => {
                it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                    "%p",
                    async (contractId: any) => {
                        const promise = sdk.authorizeOngoingAccess(
                            {
                                applicationId: "test-application-id",
                                contractId,
                                privateKey: testKeyPair.exportKey("pkcs1-private-pem"),
                                redirectUri: "test-redirect-uri",
                            } as any,
                            {
                                expiry: 0,
                                sessionKey: "test-session-key",
                                sessionExchangeToken: "test-session-exchange-token",
                            },
                        );

                        return expect(promise).rejects.toThrowError(TypeValidationError);
                    },
                );
            });

            describe("Throws TypeValidationError when redirectUri is ", () => {
                it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                    "%p",
                    async (redirectUri: any) => {
                        const promise = sdk.authorizeOngoingAccess(
                            {
                                applicationId: "test-application-id",
                                contractId: "test-contract-id",
                                privateKey: testKeyPair.exportKey("pkcs1-private-pem"),
                                redirectUri,
                            } as any,
                            {
                                expiry: 0,
                                sessionKey: "test-session-key",
                                sessionExchangeToken: "test-session-exchange-token",
                            },
                        );

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

                const promise = sdk.authorizeOngoingAccess(
                    {
                        applicationId: "test-application-id",
                        contractId: "test-contract-id",
                        privateKey: testKeyPair.exportKey("pkcs1-private-pem"),
                        redirectUri: "test-redirect-uri",
                    },
                    {
                        expiry: 0,
                        sessionKey: "test-session-key",
                        sessionExchangeToken: "test-session-exchange-token",
                    },
                );

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

                const promise = sdk.authorizeOngoingAccess(
                    {
                        applicationId: "test-application-id",
                        contractId: "test-contract-id",
                        privateKey: testKeyPair.exportKey("pkcs1-private-pem"),
                        redirectUri: "test-redirect-uri",
                    },
                    {
                        expiry: 0,
                        sessionKey: "test-session-key",
                        sessionExchangeToken: "test-session-exchange-token",
                    },
                );

                return expect(promise).rejects.toThrowError(SDKVersionInvalidError);
            });

            it(`Throws JWT errors correctly`, () => {
                const jwt: string = sign(
                    {
                        preauthorization_code: "test-preauth-code",
                    },
                    testKeyPair.exportKey("pkcs1-private-pem"),
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

                const promise = sdk.authorizeOngoingAccess(
                    {
                        applicationId: "test-application-id",
                        contractId: "test-contract-id",
                        privateKey: testKeyPair.exportKey("pkcs1-private-pem"),
                        redirectUri: "test-redirect-uri",
                    },
                    {
                        expiry: 0,
                        sessionKey: "test-session-key",
                        sessionExchangeToken: "test-session-exchange-token",
                    },
                );

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

                const promise = sdk.authorizeOngoingAccess(
                    {
                        applicationId: "test-application-id",
                        contractId: "test-contract-id",
                        privateKey: testKeyPair.exportKey("pkcs1-private-pem"),
                        redirectUri: "test-redirect-uri",
                    },
                    {
                        expiry: 0,
                        sessionKey: "test-session-key",
                        sessionExchangeToken: "test-session-exchange-token",
                    },
                );

                return expect(promise).rejects.toThrowError(HTTPError);
            });
        });

        describe(`Calling authorizeOngoingAccess with no auth token passed in`, () => {

            let response: AuthorizeOngoingAccessResponse;
            beforeAll(async () => {
                const jwt: string = sign(
                    {
                        preauthorization_code: "test-preauth-code",
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

                response = await sdk.authorizeOngoingAccess(
                    {
                        applicationId: "test-application-id",
                        contractId: "test-contract-id",
                        privateKey: testKeyPair.exportKey("pkcs1-private-pem"),
                        redirectUri: "test-redirect-uri",
                    },
                    {
                        expiry: 0,
                        sessionKey: "test-session-key",
                        sessionExchangeToken: "test-session-exchange-token",
                    },
                );
            });

            it("returns an object with dataAuthorized to be false", () => {
                expect(response.dataAuthorized).toBe(false);
            });

            it("returns an object with codeVerifier returned", () => {
                expect(response.codeVerifier).toBeDefined();
            });

            it("returns an object with digi.me deep link returned", () => {
                expect(response.authorizationUrl).toBeDefined();
            });
        });

        describe(`Calling authorizeOngoingAccess with auth token passed in triggers a data query`, () => {
            let response: AuthorizeOngoingAccessResponse;
            beforeAll(async () => {
                nock(`${new URL(baseUrl).origin}`)
                    .post(`${new URL(baseUrl).pathname}/permission-access/trigger`)
                    .reply(202);

                response = await sdk.authorizeOngoingAccess(
                    {
                        applicationId: "test-application-id",
                        contractId: "test-contract-id",
                        privateKey: testKeyPair.exportKey("pkcs1-private-pem"),
                        redirectUri: "test-redirect-uri",
                        accessToken: {
                            accessToken: "test-access-token",
                            refreshToken: "refresh-token",
                            expiry: 10000,
                        },
                    },
                    {
                        expiry: 0,
                        sessionKey: "test-session-key",
                        sessionExchangeToken: "test-session-exchange-token",
                    },
                );
            });

            it("returns an object with dataReady to be true", () => {
                expect(response.dataAuthorized).toBe(true);
            });

            it("returns the same UserToken token", () => {
                const {updatedAccessToken} = response;

                if (!updatedAccessToken) {
                    throw new Error("Access Token is empty");
                }

                const {accessToken, refreshToken, expiry} = updatedAccessToken;
                expect(accessToken).toBe("test-access-token");
                expect(refreshToken).toBe("refresh-token");
                expect(expiry).toBe(10000);
            });
        });

        describe(`authorizeOngoingAccess tries to refresh token if invalid`, () => {
            let response: AuthorizeOngoingAccessResponse;
            beforeAll(async () => {
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

                nock(`${new URL(baseUrl).origin}`)
                    .post(`${new URL(baseUrl).pathname}/permission-access/trigger`)
                    .reply(401, {
                        error: {
                            code: "InvalidToken",
                            message: "The token (${tokenType}) is invalid",
                        },
                    })
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

                response = await sdk.authorizeOngoingAccess(
                    {
                        applicationId: "test-application-id",
                        contractId: "test-contract-id",
                        privateKey: testKeyPair.exportKey("pkcs1-private-pem"),
                        redirectUri: "test-redirect-uri",
                        accessToken: {
                            accessToken: "test-access-token",
                            refreshToken: "refresh-token",
                            expiry: 10000,
                        },
                    },
                    {
                        expiry: 0,
                        sessionKey: "test-session-key",
                        sessionExchangeToken: "test-session-exchange-token",
                    },
                );
            });

            it("returns an object with dataAuthorized to be true", () => {
                expect(response.dataAuthorized).toBe(true);
            });

            it("returns the refreshed UserToken token", () => {
                const {updatedAccessToken} = response;

                if (!updatedAccessToken) {
                    throw new Error("Access Token is empty");
                }

                const {accessToken, refreshToken, expiry} = updatedAccessToken;
                expect(accessToken).toBe("refreshed-test-access-token");
                expect(refreshToken).toBe("refreshed-test-refresh-token");
                expect(expiry).toBe(2000000);
            });
        });

        describe(`authorizeOngoingAccess defaults to returning digi.me deeplink if refresh fails`, () => {
            let response: AuthorizeOngoingAccessResponse;
            beforeAll(async () => {
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

                response = await sdk.authorizeOngoingAccess(
                    {
                        applicationId: "test-application-id",
                        contractId: "test-contract-id",
                        privateKey: testKeyPair.exportKey("pkcs1-private-pem"),
                        redirectUri: "test-redirect-uri",
                        accessToken: {
                            accessToken: "test-access-token",
                            refreshToken: "refresh-token",
                            expiry: 10000,
                        },
                    },
                    {
                        expiry: 0,
                        sessionKey: "test-session-key",
                        sessionExchangeToken: "test-session-exchange-token",
                    },
                );
            });

            it("returns an object with dataAuthorized to be false", () => {
                expect(response.dataAuthorized).toBe(false);
            });

            it("returns an object with codeVerifier returned", () => {
                expect(response.codeVerifier).toBeDefined();
            });

            it("returns an object with digi.me deep link returned", () => {
                expect(response.authorizationUrl).toBeDefined();
            });

        });

        describe(`exchangeCodeForToken throws errors `, () => {
            describe("Throws TypeValidationError when applicationId is ", () => {
                it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                    "%p",
                    async (applicationId: any) => {
                        const promise = sdk.exchangeCodeForToken(
                            {
                                applicationId,
                                contractId: "test-contract-id",
                                privateKey: testKeyPair.exportKey("pkcs1-private-pem"),
                                redirectUri: "test-redirect-uri",
                            } as any,
                            "test-code-verifier",
                            "test-token",
                        );

                        return expect(promise).rejects.toThrowError(TypeValidationError);
                    },
                );
            });
            describe("Throws TypeValidationError when contractId is ", () => {
                it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                    "%p",
                    async (contractId: any) => {
                        const promise = sdk.exchangeCodeForToken(
                            {
                                applicationId: "test-application-id",
                                contractId,
                                privateKey: testKeyPair.exportKey("pkcs1-private-pem"),
                                redirectUri: "test-redirect-uri",
                            } as any,
                            "test-code-verifier",
                            "test-token",
                        );

                        return expect(promise).rejects.toThrowError(TypeValidationError);
                    },
                );
            });
            describe("Throws TypeValidationError when redirectUri is ", () => {
                it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                    "%p",
                    async (redirectUri: any) => {
                        const promise = sdk.exchangeCodeForToken(
                            {
                                applicationId: "test-application-id",
                                contractId: "test-contract-id",
                                privateKey: testKeyPair.exportKey("pkcs1-private-pem"),
                                redirectUri,
                            } as any,
                            "test-code-verifier",
                            "test-token",
                        );

                        return expect(promise).rejects.toThrowError(TypeValidationError);
                    },
                );
            });
            describe("Throws TypeValidationError when code verifier is ", () => {
                it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                    "%p",
                    async (codeVerifier: any) => {
                        const promise = sdk.exchangeCodeForToken(
                            {
                                applicationId: "test-application-id",
                                contractId: "test-contract-id",
                                privateKey: testKeyPair.exportKey("pkcs1-private-pem"),
                                redirectUri: "test-redirect-uri",
                            } as any,
                            codeVerifier,
                            "test-token",
                        );

                        return expect(promise).rejects.toThrowError(TypeValidationError);
                    },
                );
            });

            describe("Throws TypeValidationError when code verifier is ", () => {
                it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                    "%p",
                    async (token: any) => {
                        const promise = sdk.exchangeCodeForToken(
                            {
                                applicationId: "test-application-id",
                                contractId: "test-contract-id",
                                privateKey: testKeyPair.exportKey("pkcs1-private-pem"),
                                redirectUri: "test-redirect-uri",
                            } as any,
                            "test-code-verifier",
                            token,
                        );

                        return expect(promise).rejects.toThrowError(TypeValidationError);
                    },
                );
            });
        });

        describe(`exchangeCodeForToken returns successfully`, () => {
            let token: UserAccessToken;

            beforeAll(async () => {
                const jwt: string = sign(
                    {
                        access_token: `test-access-token`,
                        refresh_token: `test-refresh-token`,
                        expires_on: 1000000, // Test expiry timestamp
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

                token = await sdk.exchangeCodeForToken(
                    {
                        applicationId: "test-application-id",
                        contractId: "test-contract-id",
                        privateKey: testKeyPair.exportKey("pkcs1-private-pem"),
                        redirectUri: "test-redirect-uri",
                    } as any,
                    "test-code-verifier",
                    "token",
                );
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

    },
);
