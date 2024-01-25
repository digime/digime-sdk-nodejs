/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { describe, test, expect } from "vitest";
import { mswServer } from "../../mocks/server";
import { handlers as discoveryServicesHandlers } from "../../mocks/api/discovery/services/handlers";
import { handlers as oauthAuthorizeHandlers } from "../../mocks/api/oauth/authorize/handlers";
import { handlers as oauthTokenHandlers } from "../../mocks/api/oauth/token/handlers";
import { handlers as permissionAccessSampleDataSetsHandlers } from "../../mocks/api/permission-access/sample/datasets/handlers";
import { DigiMeSdk } from "./digi-me-sdk";
import { UserAuthorization } from "../user-authorization";
import { DigiMeSdkError, DigiMeSdkTypeError } from "../errors/errors";
import { mockSdkConsumerCredentials } from "../../mocks/sdk-consumer-credentials";
import { randomInt } from "node:crypto";

export const mockSdkOptions = {
    applicationId: mockSdkConsumerCredentials.applicationId,
    contractId: mockSdkConsumerCredentials.contractId,
    contractPrivateKey: mockSdkConsumerCredentials.privateKeyPkcs1PemString,
} as const satisfies ConstructorParameters<typeof DigiMeSdk>[0];

describe("DigiMeSDK", () => {
    describe("Instanced", () => {
        describe("Constructor", () => {
            test("Works with minimal arguments", () => {
                expect(() => new DigiMeSdk(mockSdkOptions)).not.toThrow();
            });

            test("Throws if provided no config", () => {
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

            test("Throws if given wrong type as config", () => {
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

            test("Throws if provided an empty object as config", () => {
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

            test("Throws if the values are of the wrong type in the provided config ", () => {
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

                const sdk = new DigiMeSdk(mockSdkOptions);

                await expect(sdk.getAvailableServices()).resolves.toMatchObject({
                    countries: expect.anything(),
                    services: expect.arrayContaining([expect.objectContaining({ name: "TEST SOURCE" })]),
                    serviceGroups: expect.anything(),
                });
            });

            test('Uses the "contractId" parameter', async () => {
                mswServer.use(...discoveryServicesHandlers);

                const sdk = new DigiMeSdk(mockSdkOptions);

                await expect(sdk.getAvailableServices({ contractId: "test" })).resolves.toMatchObject({
                    countries: expect.anything(),
                    services: expect.arrayContaining([expect.objectContaining({ name: "CONTRACT ONLY TEST SOURCE" })]),
                    serviceGroups: expect.anything(),
                });
            });

            test("Throws if abort signal is triggered", async () => {
                mswServer.use(...discoveryServicesHandlers);

                const sdk = new DigiMeSdk(mockSdkOptions);
                const signal = AbortSignal.abort();

                const promise = sdk.getAvailableServices({ signal });

                await expect(promise).rejects.toBeInstanceOf(Error);
                await expect(promise).rejects.toHaveProperty("name", "AbortError");
            });

            test("Throws if `contractId` argument is of the wrong type", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);

                // @ts-expect-error Providing wrong arguments on purpose
                const promise = sdk.getAvailableServices({ contractId: [] });

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`getAvailableServices\` parameters (1 issue):
                   • "contractId": Expected string, received array]
                `);
            });

            test("Throws if `signal` argument is of the wrong type", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);

                // @ts-expect-error Providing wrong arguments on purpose
                const promise = sdk.getAvailableServices({ signal: {} });

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`getAvailableServices\` parameters (1 issue):
                   • "signal": Input not instance of AbortSignal]
                `);
            });
        });

        describe(".getAuthorizeUrl()", () => {
            test("Works with minimal parameters", async () => {
                mswServer.use(...oauthAuthorizeHandlers);

                const sdk = new DigiMeSdk(mockSdkOptions);

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

            test("Sets correct `sourceType` on the URL if provided", async () => {
                mswServer.use(...oauthAuthorizeHandlers);

                const sdk = new DigiMeSdk(mockSdkOptions);

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

            test("Adds `serviceId` to the URL if provided", async () => {
                mswServer.use(...oauthAuthorizeHandlers);

                const sdk = new DigiMeSdk(mockSdkOptions);

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

            test("Adds `lng` to the URL if provided", async () => {
                mswServer.use(...oauthAuthorizeHandlers);

                const sdk = new DigiMeSdk(mockSdkOptions);

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

            test("Adds `includeSampleDataOnlySources` to the URL if provided", async () => {
                mswServer.use(...oauthAuthorizeHandlers);

                const sdk = new DigiMeSdk(mockSdkOptions);

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

            test("Throws if the abort signal is triggered", async () => {
                mswServer.use(...oauthAuthorizeHandlers);

                const sdk = new DigiMeSdk(mockSdkOptions);
                const signal = AbortSignal.abort();

                const promise = sdk.getAuthorizeUrl({ callback: "test-callback", state: "", signal });

                await expect(promise).rejects.toBeInstanceOf(Error);
                await expect(promise).rejects.toHaveProperty("name", "AbortError");
            });

            test("Throws if provided no arguments", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);

                // @ts-expect-error Providing wrong arguments on purpose
                const promise = sdk.getAuthorizeUrl();

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`getAuthorizeUrl\` parameters (1 issue):
                   • \`getAuthorizeUrl\` parameters are required]
                `);
            });

            test("Throws if `parameters` argument is not an object", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);

                // @ts-expect-error Providing wrong arguments on purpose
                const promise = sdk.getAuthorizeUrl(0);

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`getAuthorizeUrl\` parameters (1 issue):
                   • Expected object, received number]
                `);
            });

            test("Throws if `parameters` argument is an empty object", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);

                // @ts-expect-error Providing wrong arguments on purpose
                const promise = sdk.getAuthorizeUrl({});

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`getAuthorizeUrl\` parameters (2 issues):
                   • "callback": Required
                   • "state": Required]
                `);
            });

            test("Throws if `parameters` argument is an object with incorrect properties", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);

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

                const sdk = new DigiMeSdk(mockSdkOptions);

                const result = await sdk.exchangeCodeForUserAuthorization({
                    codeVerifier: "test-code-verifier",
                    authorizationCode: "test-authorization-code",
                });

                expect(result).toBeInstanceOf(UserAuthorization);
                expect(result.asJwt()).toEqual(expect.any(String));
            });

            test("Throws if abort signal is triggered", async () => {
                mswServer.use(...oauthTokenHandlers);

                const sdk = new DigiMeSdk(mockSdkOptions);
                const signal = AbortSignal.abort();

                const promise = sdk.exchangeCodeForUserAuthorization({
                    codeVerifier: "test-code-verifier",
                    authorizationCode: "test-authorization-code",
                    signal,
                });

                await expect(promise).rejects.toBeInstanceOf(Error);
                await expect(promise).rejects.toHaveProperty("name", "AbortError");
            });

            test("Throws if provided no arguments", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);

                // @ts-expect-error Providing wrong type on purpose
                const promise = sdk.exchangeCodeForUserAuthorization();

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`exchangeCodeForUserAuthorization\` parameters (1 issue):
                   • Required]
                `);
            });

            test("Throws if `parameters` argument is not an object", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);

                // @ts-expect-error Providing wrong type on purpose
                const promise = sdk.exchangeCodeForUserAuthorization([]);

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`exchangeCodeForUserAuthorization\` parameters (1 issue):
                   • Expected object, received array]
                `);
            });

            test("Throws if `parameters` argument is an empty object", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);

                // @ts-expect-error Providing wrong type on purpose
                const promise = sdk.exchangeCodeForUserAuthorization({});

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`exchangeCodeForUserAuthorization\` parameters (2 issues):
                   • "codeVerifier": Required
                   • "authorizationCode": Required]
                `);
            });

            test("Throws if `parameters` argument is an object with incorrect shape", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);

                const promise = sdk.exchangeCodeForUserAuthorization({
                    // @ts-expect-error Providing wrong type on purpose
                    codeVerifier: 1,
                    // @ts-expect-error Providing wrong type on purpose
                    authorizationCode: [],
                    // @ts-expect-error Providing wrong type on purpose
                    signal: "",
                });

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`exchangeCodeForUserAuthorization\` parameters (3 issues):
                   • "codeVerifier": Expected string, received number
                   • "authorizationCode": Expected string, received array
                   • "signal": Input not instance of AbortSignal]
                `);
            });
        });

        describe(".refreshUserAuthorization()", () => {
            test("Returns a new UserAuthorization instance", async () => {
                mswServer.use(...oauthTokenHandlers);

                const sdk = new DigiMeSdk(mockSdkOptions);

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
                const result = await sdk.refreshUserAuthorization({ userAuthorization });

                expect(result).toBeInstanceOf(UserAuthorization);
                expect(result.asJwt()).toEqual(expect.any(String));
                expect(result).not.toBe(userAuthorization);
            });

            test("Throws if abort signal is triggered", async () => {
                mswServer.use(...oauthTokenHandlers);

                const sdk = new DigiMeSdk(mockSdkOptions);
                const signal = AbortSignal.abort();
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

                const promise = sdk.refreshUserAuthorization({ userAuthorization, signal });

                await expect(promise).rejects.toBeInstanceOf(Error);
                await expect(promise).rejects.toHaveProperty("name", "AbortError");
            });

            test("Throws if provided no arguments", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);

                // @ts-expect-error Providing wrong type on purpose
                const promise = sdk.refreshUserAuthorization();

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`refreshUserAuthorization\` parameters (1 issue):
                   • Required]
                `);
            });

            test("Throws if `parameters` argument is not an object", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);

                // @ts-expect-error Providing wrong type on purpose
                const promise = sdk.refreshUserAuthorization([]);

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`refreshUserAuthorization\` parameters (1 issue):
                   • Expected object, received array]
                `);
            });

            test("Throws if `parameters` argument is an empty object", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);

                // @ts-expect-error Providing wrong type on purpose
                const promise = sdk.refreshUserAuthorization({});

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`refreshUserAuthorization\` parameters (1 issue):
                   • "userAuthorization": Input not instance of UserAuthorization]
                `);
            });

            test("Throws if `parameters` argument is an object with incorrect shape", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);

                const promise = sdk.refreshUserAuthorization({
                    // @ts-expect-error Providing wrong type on purpose
                    userAuthorization: 1,
                    // @ts-expect-error Providing wrong type on purpose
                    signal: "",
                });

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`refreshUserAuthorization\` parameters (2 issues):
                   • "userAuthorization": Input not instance of UserAuthorization
                   • "signal": Input not instance of AbortSignal]
                `);
            });
        });

        describe(".getSampleDataSetsForSource()", () => {
            test("Works with minimal parameters", async () => {
                mswServer.use(...permissionAccessSampleDataSetsHandlers);

                const sdk = new DigiMeSdk(mockSdkOptions);
                const mockedSourceId = randomInt(1, 10000);
                await expect(sdk.getSampleDataSetsForSource({ sourceId: mockedSourceId })).resolves.toMatchObject({
                    [`mocked-${mockedSourceId}`]: expect.objectContaining({
                        description: expect.any(String),
                        name: `mocked-${mockedSourceId}`,
                    }),
                });
            });

            test("Throws if abort signal is triggered", async () => {
                mswServer.use(...permissionAccessSampleDataSetsHandlers);

                const sdk = new DigiMeSdk(mockSdkOptions);
                const signal = AbortSignal.abort();

                const promise = sdk.getSampleDataSetsForSource({ sourceId: 1, signal });

                await expect(promise).rejects.toBeInstanceOf(Error);
                await expect(promise).rejects.toHaveProperty("name", "AbortError");
            });

            test("Throws if provided no arguments", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);

                // @ts-expect-error Providing wrong type on purpose
                const promise = sdk.getSampleDataSetsForSource();

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`getSampleDataSetsForSource\` parameters (1 issue):
                   • Required]
                `);
            });

            test("Throws if `parameters` argument is not an object", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);

                // @ts-expect-error Providing wrong type on purpose
                const promise = sdk.getSampleDataSetsForSource([]);

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`getSampleDataSetsForSource\` parameters (1 issue):
                   • Expected object, received array]
                `);
            });

            test("Throws if `parameters` argument is an empty object", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);

                // @ts-expect-error Providing wrong type on purpose
                const promise = sdk.getSampleDataSetsForSource({});

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`getSampleDataSetsForSource\` parameters (1 issue):
                   • "sourceId": Required]
                `);
            });

            test("Throws if `parameters` argument is an object with incorrect shape", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);

                const promise = sdk.getSampleDataSetsForSource({
                    // @ts-expect-error Providing wrong type on purpose
                    sourceId: "1",
                    // @ts-expect-error Providing wrong type on purpose
                    signal: "",
                });

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`getSampleDataSetsForSource\` parameters (2 issues):
                   • "sourceId": Expected number, received string
                   • "signal": Input not instance of AbortSignal]
                `);
            });
        });
    });
});

describe("DigiMeSdkAuthorized", () => {
    describe("Instanced", () => {
        describe("Constructor", () => {
            test("Throws if", () => {});
            test("Throws if", () => {});
            test("Throws if", () => {});
            test("Throws if", () => {});
        });
    });
});
