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

describe("DigiMeSDK", () => {
    describe("constructor", () => {
        test("Works with minimal parameters", () => {
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
                // @ts-expect-error Not passing in parameters on purpose
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

        test("Throws when given wrong config type", () => {
            try {
                // @ts-expect-error Not passing in parameters on purpose
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

        test("Throws when provided an empty object", () => {
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

        test("Throws when provided an bad config", () => {
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
        test("No parameters", async () => {
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

        test('With "contractId" parameter', async () => {
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
        test("Works with minimal parameters", async () => {
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
    });

    describe(".exchangeCodeForUserAuthorization()", () => {
        test("Works with minimal parameters", async () => {
            mswServer.use(...oauthTokenHandlers);

            const sdk = new DigiMeSdk({
                applicationId: mockSdkConsumerCredentials.applicationId,
                contractId: mockSdkConsumerCredentials.contractId,
                contractPrivateKey: mockSdkConsumerCredentials.privateKeyPkcs1PemString,
            });

            const result = await sdk.exchangeCodeForUserAuthorization("test-code-verifier", "test-authorization-code");

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
