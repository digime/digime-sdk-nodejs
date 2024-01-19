/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { describe, test, expect } from "vitest";
import { DigiMeSdk } from "../index";
import { mswServer } from "../mocks/server";
import { handlers as discoveryServicesHandlers } from "../mocks/api/discovery/services/handlers";
import { DigiMeSdkError, DigiMeSdkTypeError } from "../errors/errors";
import { mockSdkConsumerCredentials } from "../mocks/sdk-consumer-credentials";
import { handlers as oauthAuthorizeHandlers } from "../mocks/api/oauth/authorize/handlers";
import { handlers as oauthTokenHandlers } from "../mocks/api/oauth/token/handlers";
import { UserAuthorization } from "../user-authorization";
import { fromMockApiBase, getTestUrl } from "../mocks/utilities";

describe("DigiMeSDK", () => {
    describe("Static", () => {
        describe("getJwksKeyResolverForUrl", () => {
            test("Gets the default JWKS without manually adding it", () => {
                const result = DigiMeSdk.getJwksKeyResolverForUrl(fromMockApiBase("jwks/oauth"));
                expect(result).toBeInstanceOf(Function);
            });

            test("Throws when trying to get a JWKS that was not added as trusted", () => {
                const operation = () => {
                    DigiMeSdk.getJwksKeyResolverForUrl(new URL(".well-known/jwks", getTestUrl()).toString());
                };

                expect(operation).toThrow(DigiMeSdkError);
                expect(operation).toThrowErrorMatchingInlineSnapshot(`
                  [DigiMeSdkError: Attempted to get a JWKS key resolver for an URL that has not yet been added as a trusted JWKS URL.

                  A JWKS URL is marked as trusted when:
                  • You manually call \`addUrlAsTrustedJWKS\` with a URL
                  • Instantiate a DigiMeSDK instance with a \`baseUrl\` other than the default one,
                    This adds "<baseUrl>/jwks/oauth" as a trusted JWKS URL]
                `);
            });

            test("Throws when the URL is malformed", () => {
                const operation = () => DigiMeSdk.getJwksKeyResolverForUrl("test/.well-known/jwks");
                expect(operation).toThrow(DigiMeSdkTypeError);
                expect(operation).toThrowErrorMatchingInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`url\` argument (1 issue):
                   • Invalid url]
                `);
            });
        });

        describe("addUrlAsTrustedJwks", () => {
            test("Adds a valid URL", () => {
                const url = getTestUrl(".well-known/jwks");
                const result = DigiMeSdk.addUrlAsTrustedJwks(url);
                const keyGetter = DigiMeSdk.getJwksKeyResolverForUrl(url);

                expect(result).toBe(undefined);
                expect(keyGetter).toBeInstanceOf(Function);
            });

            test("Throws when the URL is malformed", () => {
                const operation = () => DigiMeSdk.addUrlAsTrustedJwks("test/.well-known/jwks");
                expect(operation).toThrow(DigiMeSdkTypeError);
                expect(operation).toThrowErrorMatchingInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`url\` argument (1 issue):
                   • Invalid url]
                `);
            });
        });
    });

    describe("Instanced", () => {
        describe("Constructor", () => {
            test("Works with minimal arguments", () => {
                expect(
                    () =>
                        new DigiMeSdk({
                            applicationId: mockSdkConsumerCredentials.applicationId,
                            contractId: mockSdkConsumerCredentials.applicationId,
                            contractPrivateKey: mockSdkConsumerCredentials.privateKeyPkcs1PemString,
                        }),
                ).not.toThrow();
            });

            test("Throws when provided with no config", () => {
                try {
                    // @ts-expect-error Not passing in arguments on purpose
                    new DigiMeSdk();
                    expect.unreachable();
                } catch (error) {
                    expect(error).toBeInstanceOf(Error);
                    expect(error).toBeInstanceOf(DigiMeSdkError);
                    expect(error).toBeInstanceOf(DigiMeSdkTypeError);
                    expect(error).toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for DigiMeSDK constructor parameter "sdkConfig" (1 issue):
                   • SdkConfig is required]
                `);
                }
            });

            test("Throws when given wrong type as config", () => {
                try {
                    // @ts-expect-error Passing in wrong arguments on purpose
                    new DigiMeSdk([]);
                    expect.unreachable();
                } catch (error) {
                    expect(error).toBeInstanceOf(Error);
                    expect(error).toBeInstanceOf(DigiMeSdkError);
                    expect(error).toBeInstanceOf(DigiMeSdkTypeError);
                    expect(error).toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for DigiMeSDK constructor parameter "sdkConfig" (1 issue):
                   • SdkConfig must be an object]
                `);
                }
            });

            test("Throws when provided an empty object as config", () => {
                try {
                    // @ts-expect-error Passing empty object on purpose
                    new DigiMeSdk({});
                    expect.unreachable();
                } catch (error) {
                    expect(error).toBeInstanceOf(Error);
                    expect(error).toBeInstanceOf(DigiMeSdkError);
                    expect(error).toBeInstanceOf(DigiMeSdkTypeError);
                    expect(error).toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for DigiMeSDK constructor parameter "sdkConfig" (3 issues):
                   • "applicationId": Required
                   • "contractId": Required
                   • "contractPrivateKey": Required]
                `);
                }
            });

            test("Throws when the values are of the wrong type in the provided config ", () => {
                try {
                    new DigiMeSdk({
                        // @ts-expect-error Intentionally wrong
                        contractPrivateKey: 1,
                        // @ts-expect-error Intentionally wrong
                        onboardUrl: ["a", "b", "c"],
                    });
                    expect.unreachable();
                } catch (error) {
                    expect(error).toBeInstanceOf(Error);
                    expect(error).toBeInstanceOf(DigiMeSdkError);
                    expect(error).toBeInstanceOf(DigiMeSdkTypeError);
                    expect(error).toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for DigiMeSDK constructor parameter "sdkConfig" (4 issues):
                   • "applicationId": Required
                   • "contractId": Required
                   • "contractPrivateKey": Expected string, received number
                   • "onboardUrl": Expected string, received array]
                `);
                }
            });
        });

        describe(".getAvailableServices()", () => {
            test("Works without any arguments provided", async () => {
                mswServer.use(...discoveryServicesHandlers);

                const sdk = new DigiMeSdk({
                    applicationId: mockSdkConsumerCredentials.applicationId,
                    contractId: mockSdkConsumerCredentials.contractId,
                    contractPrivateKey: mockSdkConsumerCredentials.privateKeyPkcs1PemString,
                });

                await expect(sdk.getAvailableServices()).resolves.toMatchObject({
                    countries: expect.anything(),
                    services: expect.arrayContaining([expect.objectContaining({ name: "TEST SOURCE" })]),
                    serviceGroups: expect.anything(),
                });
            });

            test('Uses the "contractId" parameter', async () => {
                mswServer.use(...discoveryServicesHandlers);

                const sdk = new DigiMeSdk({
                    applicationId: mockSdkConsumerCredentials.applicationId,
                    contractId: mockSdkConsumerCredentials.contractId,
                    contractPrivateKey: mockSdkConsumerCredentials.privateKeyPkcs1PemString,
                });

                await expect(sdk.getAvailableServices({ contractId: "test" })).resolves.toMatchObject({
                    countries: expect.anything(),
                    services: expect.arrayContaining([expect.objectContaining({ name: "CONTRACT ONLY TEST SOURCE" })]),
                    serviceGroups: expect.anything(),
                });
            });

            test.todo("Aborts when abort signal is triggered");
        });

        describe(".getAuthorizeUrl()", () => {
            test("Works with minimal arguments", async () => {
                mswServer.use(...oauthAuthorizeHandlers);

                const sdk = new DigiMeSdk({
                    applicationId: mockSdkConsumerCredentials.applicationId,
                    contractId: mockSdkConsumerCredentials.contractId,
                    contractPrivateKey: mockSdkConsumerCredentials.privateKeyPkcs1PemString,
                });

                const result = await sdk.getAuthorizeUrl({
                    callback: "test-callback",
                    state: "",
                });

                expect(result).toEqual(expect.any(Object));
                expect(result.codeVerifier).toEqual(expect.any(String));
                expect(result.url).toMatchInlineSnapshot(
                    `"https://api.digi.me/apps/saas/authorize?code=test-preauthorization-code&sourceType=pull"`,
                );
                expect(result.session).toEqual(expect.any(Object));
                expect(result.session.expiry).toEqual(expect.any(Number));
                expect(result.session.key).toMatchInlineSnapshot(`"test-session-key"`);
            });

            test("Sets the correct `sourceType` on the URL when provided", async () => {
                mswServer.use(...oauthAuthorizeHandlers);

                const sdk = new DigiMeSdk({
                    applicationId: mockSdkConsumerCredentials.applicationId,
                    contractId: mockSdkConsumerCredentials.contractId,
                    contractPrivateKey: mockSdkConsumerCredentials.privateKeyPkcs1PemString,
                });

                const result = await sdk.getAuthorizeUrl({
                    callback: "test-callback",
                    state: "",
                    sourceType: "push",
                });

                expect(result).toEqual(expect.any(Object));
                expect(result.url).toMatchInlineSnapshot(
                    `"https://api.digi.me/apps/saas/authorize?code=test-preauthorization-code&sourceType=push"`,
                );
            });

            test("Adds the `serviceId` to the URL when provided", async () => {
                mswServer.use(...oauthAuthorizeHandlers);

                const sdk = new DigiMeSdk({
                    applicationId: mockSdkConsumerCredentials.applicationId,
                    contractId: mockSdkConsumerCredentials.contractId,
                    contractPrivateKey: mockSdkConsumerCredentials.privateKeyPkcs1PemString,
                });

                const result = await sdk.getAuthorizeUrl({
                    callback: "test-callback",
                    state: "",
                    serviceId: 7357,
                });

                expect(result).toEqual(expect.any(Object));
                expect(result.url).toMatchInlineSnapshot(
                    `"https://api.digi.me/apps/saas/authorize?code=test-preauthorization-code&sourceType=pull&service=7357"`,
                );
            });

            test("Adds the `lng` to the URL when provided", async () => {
                mswServer.use(...oauthAuthorizeHandlers);

                const sdk = new DigiMeSdk({
                    applicationId: mockSdkConsumerCredentials.applicationId,
                    contractId: mockSdkConsumerCredentials.contractId,
                    contractPrivateKey: mockSdkConsumerCredentials.privateKeyPkcs1PemString,
                });

                const result = await sdk.getAuthorizeUrl({
                    callback: "test-callback",
                    state: "",
                    preferredLocale: "jp-JP",
                });

                expect(result).toEqual(expect.any(Object));
                expect(result.url).toMatchInlineSnapshot(
                    `"https://api.digi.me/apps/saas/authorize?code=test-preauthorization-code&sourceType=pull&lng=jp-JP"`,
                );
            });

            test("Adds the `includeSampleDataOnlySources` to the URL when provided", async () => {
                mswServer.use(...oauthAuthorizeHandlers);

                const sdk = new DigiMeSdk({
                    applicationId: mockSdkConsumerCredentials.applicationId,
                    contractId: mockSdkConsumerCredentials.contractId,
                    contractPrivateKey: mockSdkConsumerCredentials.privateKeyPkcs1PemString,
                });

                const result = await sdk.getAuthorizeUrl({
                    callback: "test-callback",
                    state: "",
                    includeSampleDataOnlySources: true,
                });

                expect(result).toEqual(expect.any(Object));
                expect(result.url).toMatchInlineSnapshot(
                    `"https://api.digi.me/apps/saas/authorize?code=test-preauthorization-code&sourceType=pull&includeSampleDataOnlySources=true"`,
                );
            });

            test("Throws when provided with no arguments", async () => {
                const sdk = new DigiMeSdk({
                    applicationId: mockSdkConsumerCredentials.applicationId,
                    contractId: mockSdkConsumerCredentials.contractId,
                    contractPrivateKey: mockSdkConsumerCredentials.privateKeyPkcs1PemString,
                });

                // @ts-expect-error Providing wrong arguments on purpose
                const promise = sdk.getAuthorizeUrl();

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
              [DigiMeSdkTypeError: Encountered an unexpected value for \`getAuthorizeUrl\` parameters (1 issue):
               • \`getAuthorizeUrl\` parameters are required]
            `);
            });

            test("Throws when the `parameters` argument is not an object", async () => {
                const sdk = new DigiMeSdk({
                    applicationId: mockSdkConsumerCredentials.applicationId,
                    contractId: mockSdkConsumerCredentials.contractId,
                    contractPrivateKey: mockSdkConsumerCredentials.privateKeyPkcs1PemString,
                });

                // @ts-expect-error Providing wrong arguments on purpose
                const promise = sdk.getAuthorizeUrl(0);

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
              [DigiMeSdkTypeError: Encountered an unexpected value for \`getAuthorizeUrl\` parameters (1 issue):
               • Expected object, received number]
            `);
            });

            test("Throws when the `parameters` argument is empty object", async () => {
                const sdk = new DigiMeSdk({
                    applicationId: mockSdkConsumerCredentials.applicationId,
                    contractId: mockSdkConsumerCredentials.contractId,
                    contractPrivateKey: mockSdkConsumerCredentials.privateKeyPkcs1PemString,
                });

                // @ts-expect-error Providing wrong arguments on purpose
                const promise = sdk.getAuthorizeUrl({});

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
              [DigiMeSdkTypeError: Encountered an unexpected value for \`getAuthorizeUrl\` parameters (2 issues):
               • "callback": Required
               • "state": Required]
            `);
            });

            test("Throws when the `parameters` argument is an object with incorrect properties", async () => {
                const sdk = new DigiMeSdk({
                    applicationId: mockSdkConsumerCredentials.applicationId,
                    contractId: mockSdkConsumerCredentials.contractId,
                    contractPrivateKey: mockSdkConsumerCredentials.privateKeyPkcs1PemString,
                });

                const promise = sdk.getAuthorizeUrl({
                    // @ts-expect-error Providing wrong type on purpose
                    callback: [],
                    // @ts-expect-error Providing wrong type on purpose
                    state: {},
                });

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
              [DigiMeSdkTypeError: Encountered an unexpected value for \`getAuthorizeUrl\` parameters (2 issues):
               • "callback": Expected string, received array
               • "state": Expected string, received object]
            `);
            });
        });

        describe(".exchangeCodeForUserAuthorization()", () => {
            test("Works with minimal parameters", async () => {
                mswServer.use(...oauthTokenHandlers);

                const sdk = new DigiMeSdk({
                    applicationId: mockSdkConsumerCredentials.applicationId,
                    contractId: mockSdkConsumerCredentials.contractId,
                    contractPrivateKey: mockSdkConsumerCredentials.privateKeyPkcs1PemString,
                });

                const result = await sdk.exchangeCodeForUserAuthorization(
                    "test-code-verifier",
                    "test-authorization-code",
                );

                expect(result).toBeInstanceOf(UserAuthorization);
                expect(result.asJwt()).toEqual(expect.any(String));
            });
        });

        describe(".refreshUserAuthorization()", () => {
            test("Returns a new UserAuthorization instance", async () => {
                mswServer.use(...oauthTokenHandlers);

                const sdk = new DigiMeSdk({
                    applicationId: mockSdkConsumerCredentials.applicationId,
                    contractId: mockSdkConsumerCredentials.contractId,
                    contractPrivateKey: mockSdkConsumerCredentials.privateKeyPkcs1PemString,
                });

                const userAuthorization = UserAuthorization.fromPayload({
                    access_token: {
                        value: "test-access-token",
                        expires_on: 1,
                    },
                    refresh_token: {
                        value: "test-refresh-token",
                        expires_on: 2,
                    },
                    sub: "test-sub",
                });
                const result = await sdk.refreshUserAuthorization(userAuthorization);

                expect(result).toBeInstanceOf(UserAuthorization);
                expect(result.asJwt()).toEqual(expect.any(String));
                expect(result).not.toBe(userAuthorization);
            });
        });
    });
});
