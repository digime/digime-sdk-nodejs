/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { describe, test, expect, vi } from "vitest";
import { mswServer } from "../../mocks/server";
import { handlers as discoveryServicesHandlers } from "../../mocks/api/discovery/services/handlers";
import { handlers as oauthAuthorizeHandlers } from "../../mocks/api/oauth/authorize/handlers";
import { handlers as oauthTokenHandlers } from "../../mocks/api/oauth/token/handlers";
import { handlers as permissionAccessSampleDataSetsHandlers } from "../../mocks/api/permission-access/sample/datasets/handlers";
import { handlers as permissionAccessAccountsHandlers } from "../../mocks/api/permission-access/accounts/handlers";
import { handlers as permissionAccessQueryHandlers } from "../../mocks/api/permission-access/query/handlers";
import { handlers as userHandlers } from "../../mocks/api/user/handlers";
import { handlers as exportHandlers } from "../../mocks/api/export/handlers";
import { DigiMeSdk, DigiMeSdkAuthorized } from "./digi-me-sdk";
import { UserAuthorization } from "../user-authorization";
import { DigiMeSdkError, DigiMeSdkTypeError } from "../errors/errors";
import { mockSdkConsumerCredentials } from "../../mocks/sdk-consumer-credentials";
import { randomInt } from "node:crypto";
import { Readable } from "node:stream";
import { fromMockApiBase } from "../../mocks/utilities";
import { HttpResponse, http } from "msw";

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

                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );

                const sdk = new DigiMeSdk(mockSdkOptions);
                const result = await sdk.refreshUserAuthorization(userAuthorization);

                expect(result).toBeInstanceOf(UserAuthorization);
                expect(result.asJwt()).toEqual(expect.any(String));
                expect(result).not.toBe(userAuthorization);
            });

            test("Throws if provided no arguments", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);

                // @ts-expect-error Providing wrong type on purpose
                const promise = sdk.refreshUserAuthorization();

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`userAuthorization\` argument (1 issue):
                   • Input not instance of UserAuthorization]
                `);
            });

            test("Throws if `userAuthorization` argument is not an instance of `UserAuthorization`", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);

                // @ts-expect-error Providing wrong type on purpose
                const promise = sdk.refreshUserAuthorization([]);

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`userAuthorization\` argument (1 issue):
                   • Input not instance of UserAuthorization]
                `);
            });

            test("Throws if the UserAuthorization can't be refreshed", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);

                const promise = sdk.refreshUserAuthorization(
                    UserAuthorization.fromPayload({
                        access_token: {
                            value: "test-access-token",
                            expires_on: 1,
                        },
                        refresh_token: {
                            value: "test-refresh-token",
                            expires_on: 2,
                        },
                        sub: "test-sub",
                    }),
                );

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkError);
                await expect(promise).rejects.toMatchInlineSnapshot(
                    `[DigiMeSdkError: SDK tried to refresh the UserAuthorization that has expired, but the provided UserAuthorization's refresh token has also expired]`,
                );
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
            test("Works with minimum parameters", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);
                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );

                const authorizedSdk = new DigiMeSdkAuthorized({
                    digiMeSdkInstance: sdk,
                    userAuthorization: userAuthorization,
                });

                expect(authorizedSdk).toBeInstanceOf(DigiMeSdkAuthorized);
            });

            test("Throws if provided no arguments", () => {
                expect(
                    // @ts-expect-error Providing wrong type on purpose
                    () => new DigiMeSdkAuthorized(),
                ).toThrowErrorMatchingInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for DigiMeSdkAuthorized constructor parameter "config" (1 issue):
                   • DigiMeSdkAuthorized config is required]
                `);
            });

            test("Throws if `config` argument is not an object", () => {
                expect(
                    // @ts-expect-error Providing wrong type on purpose
                    () => new DigiMeSdkAuthorized(""),
                ).toThrowErrorMatchingInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for DigiMeSdkAuthorized constructor parameter "config" (1 issue):
                   • DigiMeSdkAuthorized config must be an object]
                `);
            });

            test("Throws if `config` argument is an empty object", () => {
                expect(
                    // @ts-expect-error Providing wrong type on purpose
                    () => new DigiMeSdkAuthorized({}),
                ).toThrowErrorMatchingInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for DigiMeSdkAuthorized constructor parameter "config" (2 issues):
                   • "digiMeSdkInstance": Input not instance of DigiMeSdk
                   • "userAuthorization": Input not instance of UserAuthorization]
                `);
            });

            test("Throws if `config` argument is an object with incorrect shape", () => {
                expect(
                    () =>
                        new DigiMeSdkAuthorized({
                            // @ts-expect-error Providing wrong type on purpose
                            digiMeSdkInstance: 1,
                            // @ts-expect-error Providing wrong type on purpose
                            userAuthorization: [],
                            // @ts-expect-error Providing wrong type on purpose
                            onUserAuthorizationUpdated: {},
                        }),
                ).toThrowErrorMatchingInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for DigiMeSdkAuthorized constructor parameter "config" (3 issues):
                   • "digiMeSdkInstance": Input not instance of DigiMeSdk
                   • "userAuthorization": Input not instance of UserAuthorization
                   • "onUserAuthorizationUpdated": Expected function, received object]
                `);
            });
        });

        describe(".refreshUserAuthorization()", () => {
            test("Returns a new `UserAuthorization` instance", async () => {
                mswServer.use(...oauthTokenHandlers);

                const sdk = new DigiMeSdk(mockSdkOptions);
                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );

                const authorizedSdk = new DigiMeSdkAuthorized({
                    digiMeSdkInstance: sdk,
                    userAuthorization: userAuthorization,
                });

                const returnedUserAuthorization = await authorizedSdk.refreshUserAuthorization();

                expect.assertions(2);
                expect(returnedUserAuthorization).toBeInstanceOf(UserAuthorization);
                expect(returnedUserAuthorization).not.toBe(userAuthorization);
            });

            test("Triggers `onUserAuthorizationUpdated` handler correctly", async () => {
                mswServer.use(...oauthTokenHandlers);

                const sdk = new DigiMeSdk(mockSdkOptions);
                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const updateHandler = vi.fn();

                const authorizedSdk = new DigiMeSdkAuthorized({
                    digiMeSdkInstance: sdk,
                    userAuthorization: userAuthorization,
                    onUserAuthorizationUpdated: updateHandler,
                });

                const returnedUserAuthorization = await authorizedSdk.refreshUserAuthorization();

                expect.assertions(5);
                expect(returnedUserAuthorization).toBeInstanceOf(UserAuthorization);
                expect(returnedUserAuthorization).not.toBe(userAuthorization);
                expect(updateHandler).toHaveBeenCalledOnce();
                expect(updateHandler.mock.lastCall[0].oldUserAuthorization).toBe(userAuthorization);
                expect(updateHandler.mock.lastCall[0].newUserAuthorization).toBe(returnedUserAuthorization);
            });

            test("Throws if the UserAuthorization can't be refreshed", async () => {
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
                const authorizedSdk = new DigiMeSdkAuthorized({
                    digiMeSdkInstance: sdk,
                    userAuthorization: userAuthorization,
                });

                const promise = authorizedSdk.refreshUserAuthorization();

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkError);
                await expect(promise).rejects.toMatchInlineSnapshot(
                    `[DigiMeSdkError: SDK tried to refresh the UserAuthorization that has expired, but the provided UserAuthorization's refresh token has also expired]`,
                );
            });
        });

        describe(".getPortabilityReport()", () => {
            test('Returns a string when `as` is "string"', async () => {
                mswServer.use(...exportHandlers);

                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const sdk = new DigiMeSdk(mockSdkOptions);
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization);

                const result = await authorizedSdk.getPortabilityReport("string", {
                    serviceType: "medmij",
                    format: "xml",
                });

                expect(result).toEqual(expect.any(String));
            });

            test('Returns a `ReadableStream` when `as` is "ReadableStream"', async () => {
                mswServer.use(...exportHandlers);

                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const sdk = new DigiMeSdk(mockSdkOptions);
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization);

                const result = await authorizedSdk.getPortabilityReport("ReadableStream", {
                    serviceType: "medmij",
                    format: "xml",
                });

                expect(result).toEqual(expect.any(ReadableStream));
            });

            test('Returns a Node.js `Readable` when `as` is "NodeReadable"', async () => {
                mswServer.use(...exportHandlers);

                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const sdk = new DigiMeSdk(mockSdkOptions);
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization);

                const result = await authorizedSdk.getPortabilityReport("NodeReadable", {
                    serviceType: "medmij",
                    format: "xml",
                });

                expect(result).toEqual(expect.any(Readable));
            });

            test("Throws if abort signal is triggered", async () => {
                mswServer.use(...exportHandlers);

                const sdk = new DigiMeSdk(mockSdkOptions);
                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization);
                const signal = AbortSignal.abort();

                const promise = authorizedSdk.getPortabilityReport("string", {
                    serviceType: "medmij",
                    format: "xml",
                    signal,
                });

                await expect(promise).rejects.toBeInstanceOf(Error);
                await expect(promise).rejects.toHaveProperty("name", "AbortError");
            });

            test("Throws if provided no arguments", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);
                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization);

                // @ts-expect-error Providing wrong type on purpose
                const promise = authorizedSdk.getPortabilityReport();

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`getPortabilityReport\` \`as\` argument (1 issue):
                   • Must be one of: "string", "ReadableStream",  "NodeReadable"]
                `);
            });

            test("Throws if `as` argument is invalid", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);
                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization);

                // @ts-expect-error Providing wrong type on purpose
                const promise = authorizedSdk.getPortabilityReport(0, {
                    serviceType: "medmij",
                    format: "xml",
                });

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`getPortabilityReport\` \`as\` argument (1 issue):
                   • Must be one of: "string", "ReadableStream",  "NodeReadable"]
                `);
            });

            test("Throws if `options` argument is not an object", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);
                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization);

                // @ts-expect-error Providing wrong type on purpose
                const promise = authorizedSdk.getPortabilityReport("string", []);

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`getPortabilityReport\` \`options\` argument (1 issue):
                   • Expected object, received array]
                `);
            });

            test("Throws if `options` argument is an empty object", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);
                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization);

                // @ts-expect-error Providing wrong type on purpose
                const promise = authorizedSdk.getPortabilityReport("string", {});

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`getPortabilityReport\` \`options\` argument (2 issues):
                   • "format": Invalid literal value, expected "xml"
                   • "serviceType": Invalid literal value, expected "medmij"]
                `);
            });

            test("Throws if `options` argument is an object with incorrect shape", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);

                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization);

                // @ts-expect-error Providing wrong type on purpose
                const promise = authorizedSdk.getPortabilityReport("string", {
                    format: 1,
                    serviceType: [],
                    from: "1",
                    to: null,
                    signal: "",
                });

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`getPortabilityReport\` \`options\` argument (5 issues):
                   • "format": Invalid literal value, expected "xml"
                   • "serviceType": Invalid literal value, expected "medmij"
                   • "from": Expected number, received string
                   • "to": Expected number, received null
                   • "signal": Input not instance of AbortSignal]
                `);
            });

            test("Throws if the API does not return a body", async () => {
                mswServer.use(
                    http.get(fromMockApiBase("export/:serviceType/report"), async () => {
                        return new HttpResponse(undefined, { status: 204 });
                    }),
                );

                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const sdk = new DigiMeSdk(mockSdkOptions);
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization);

                const promise = authorizedSdk.getPortabilityReport("ReadableStream", {
                    serviceType: "medmij",
                    format: "xml",
                });

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`[DigiMeSdkTypeError: Response contains no body]`);
            });
        });

        describe(".deleteUser()", () => {
            test("Works with no parameters", async () => {
                mswServer.use(...userHandlers);

                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const sdk = new DigiMeSdk(mockSdkOptions);
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization);

                const result = await authorizedSdk.deleteUser();

                expect(result).toBe(undefined);
            });

            test("Throws if abort signal is triggered", async () => {
                mswServer.use(...userHandlers);

                const sdk = new DigiMeSdk(mockSdkOptions);
                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization);
                const signal = AbortSignal.abort();

                const promise = authorizedSdk.deleteUser({
                    signal,
                });

                await expect(promise).rejects.toBeInstanceOf(Error);
                await expect(promise).rejects.toHaveProperty("name", "AbortError");
            });

            test("Throws if `parameters` argument is not an object", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);
                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization);

                // @ts-expect-error Providing wrong type on purpose
                const promise = authorizedSdk.deleteUser([]);

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`deleteUser\` parameters (1 issue):
                   • Expected object, received array]
                `);
            });

            test("Throws if `parameters` argument is an object with incorrect shape", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);

                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization);

                const promise = authorizedSdk.deleteUser({
                    // @ts-expect-error Providing wrong type on purpose
                    signal: "",
                });

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`deleteUser\` parameters (1 issue):
                   • "signal": Input not instance of AbortSignal]
                `);
            });
        });

        describe(".readAccounts()", () => {
            test("Returns an array of accounts", async () => {
                mswServer.use(...permissionAccessAccountsHandlers);

                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const sdk = new DigiMeSdk(mockSdkOptions);
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization);

                const promise = authorizedSdk.readAccounts();

                await expect(promise).resolves.toBeInstanceOf(Array);
                await expect(promise).resolves.toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            id: expect.any(String),
                            type: expect.any(String),
                            sourceId: expect.any(Number),
                            createdDate: expect.any(Number),
                            updatedDate: expect.any(Number),
                        }),
                    ]),
                );
            });

            test("Throws if abort signal is triggered", async () => {
                mswServer.use(...permissionAccessAccountsHandlers);

                const sdk = new DigiMeSdk(mockSdkOptions);
                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization);
                const signal = AbortSignal.abort();

                const promise = authorizedSdk.readAccounts({
                    signal,
                });

                await expect(promise).rejects.toBeInstanceOf(Error);
                await expect(promise).rejects.toHaveProperty("name", "AbortError");
            });

            test("Throws if `parameters` argument is not an object", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);
                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization);

                const promise = authorizedSdk.readAccounts(
                    // @ts-expect-error Providing wrong type on purpose
                    [],
                );

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`readAcccounts\` parameters (1 issue):
                   • Expected object, received array]
                `);
            });

            test("Throws if `parameters` argument is an object with incorrect shape", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);

                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization);

                const promise = authorizedSdk.readAccounts({
                    // @ts-expect-error Providing wrong type on purpose
                    signal: "",
                });

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`readAcccounts\` parameters (1 issue):
                   • "signal": Input not instance of AbortSignal]
                `);
            });
        });

        describe(".readFileList()", () => {
            test("Returns the file list", async () => {
                mswServer.use(...permissionAccessQueryHandlers);

                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const sdk = new DigiMeSdk(mockSdkOptions);
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization);

                const promise = authorizedSdk.readFileList({ sessionKey: "test-session-key" });

                await expect(promise).resolves.toEqual(
                    expect.objectContaining({
                        status: expect.objectContaining({
                            state: expect.any(String),
                        }),
                        fileList: expect.arrayContaining([
                            expect.objectContaining({
                                name: expect.any(String),
                                updatedDate: expect.any(Number),
                            }),
                        ]),
                    }),
                );
            });

            test("Throws if abort signal is triggered", async () => {
                mswServer.use(...permissionAccessQueryHandlers);

                const sdk = new DigiMeSdk(mockSdkOptions);
                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization);
                const signal = AbortSignal.abort();

                const promise = authorizedSdk.readFileList({ sessionKey: "test-session-key", signal });

                await expect(promise).rejects.toBeInstanceOf(Error);
                await expect(promise).rejects.toHaveProperty("name", "AbortError");
            });

            test("Throws if `parameters` argument is not an object", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);
                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization);

                const promise = authorizedSdk.readFileList(
                    // @ts-expect-error Providing wrong type on purpose
                    [],
                );

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`readFileList\` parameters (1 issue):
                   • Expected object, received array]
                `);
            });

            test("Throws if `parameters` argument is an object with incorrect shape", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);

                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization);

                const promise = authorizedSdk.readFileList({
                    // @ts-expect-error Providing wrong type on purpose
                    sessionKey: [],
                    // @ts-expect-error Providing wrong type on purpose
                    signal: "",
                });

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`readFileList\` parameters (2 issues):
                   • "sessionKey": Expected string, received array
                   • "signal": Input not instance of AbortSignal]
                `);
            });
        });
    });
});
