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

describe("DigiMeSDK", () => {
    describe("constructor", () => {
        test("Works with minimal parameters", () => {
            expect(
                () =>
                    new DigiMeSdk({
                        applicationId: "test-application-id",
                        contractId: "test-contract-id",
                        contractPrivateKey: "test-contract-private-key",
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
                applicationId: "test-application-id",
                contractId: "test-contract-id",
                contractPrivateKey: "test-contract-private-key",
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
                applicationId: "test-application-id",
                contractId: "test-contract-id",
                contractPrivateKey: "test-contract-private-key",
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
        test("Minimal parameters", async () => {
            mswServer.use(...oauthAuthorizeHandlers);
            const sdk = new DigiMeSdk({
                applicationId: mockSdkConsumerCredentials.applicationId,
                contractId: mockSdkConsumerCredentials.contractId,
                contractPrivateKey: mockSdkConsumerCredentials.privateKeyPkcs1PemString,
            });

            const returnData = await sdk.getAuthorizeUrl({
                callback: "test-callback",
                state: "",
            });

            expect(returnData).toEqual(expect.any(Object));
            expect(returnData.codeVerifier).toEqual(expect.any(String));
            expect(returnData.url).toMatchInlineSnapshot(
                `"https://api.digi.me/apps/saas/authorize?code=test-preauthorization-code&sourceType=pull"`,
            );
            expect(returnData.session).toEqual(expect.any(Object));
            expect(returnData.session.expiry).toEqual(expect.any(Number));
            expect(returnData.session.key).toMatchInlineSnapshot(`"test-session-key"`);
        });
    });
});
