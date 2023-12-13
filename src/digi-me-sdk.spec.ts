/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { describe, test, expect } from "vitest";
import { DigiMeSDK } from "./index";
import { mswServer } from "./mocks/server";
import { handlers } from "./mocks/api/discovery/services/handlers";
import { DigiMeSdkError, DigiMeSdkTypeError } from "./errors/errors";

describe("DigiMeSDK", () => {
    describe("constructor", () => {
        test("Works with minimal parameters", () => {
            expect(() => new DigiMeSDK({ applicationId: "test-application-id" })).not.toThrow();
        });

        test("Throws when provided with no config", () => {
            try {
                // @ts-expect-error Not passing in parameters on purpose
                new DigiMeSDK();
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
                new DigiMeSDK([]);
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
                new DigiMeSDK({});
                expect.unreachable();
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error).toBeInstanceOf(DigiMeSdkError);
                expect(error).toBeInstanceOf(DigiMeSdkTypeError);
                expect(error).toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for DigiMeSDK constructor parameter "sdkConfig" (1 issue):
                   • "applicationId": Required]
                `);
            }
        });

        test("Throws when provided an bad config", () => {
            try {
                new DigiMeSDK({
                    contractDetails: {
                        // @ts-expect-error Intentionally wrong
                        privateKey: 1,
                    },
                    // @ts-expect-error Intentionally wrong
                    onboardURL: ["a", "b", "c"],
                });
                expect.unreachable();
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error).toBeInstanceOf(DigiMeSdkError);
                expect(error).toBeInstanceOf(DigiMeSdkTypeError);
                expect(error).toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for DigiMeSDK constructor parameter "sdkConfig" (4 issues):
                   • "applicationId": Required
                   • "contractDetails.contractId": Required
                   • "contractDetails.privateKey": Expected string, received number
                   • "onboardURL": Expected string, received array]
                `);
            }
        });
    });

    describe(".getAvailableServices()", () => {
        test("No parameters", async () => {
            mswServer.use(...handlers);

            const sdk = new DigiMeSDK({ applicationId: "test-application-id" });

            await expect(sdk.getAvailableServices()).resolves.toMatchObject({
                countries: expect.anything(),
                services: expect.arrayContaining([expect.objectContaining({ name: "TEST SOURCE" })]),
                serviceGroups: expect.anything(),
            });
        });

        test('With "contractId" parameter', async () => {
            mswServer.use(...handlers);

            const sdk = new DigiMeSDK({ applicationId: "test-application-id" });

            await expect(sdk.getAvailableServices({ contractId: "test" })).resolves.toMatchObject({
                countries: expect.anything(),
                services: expect.arrayContaining([expect.objectContaining({ name: "CONTRACT ONLY TEST SOURCE" })]),
                serviceGroups: expect.anything(),
            });
        });

        test.todo("Aborts when abort signal is triggered");
    });

    describe.skip(".getAuthorizeUrl()", () => {
        test("Runs", async () => {
            const sdk = new DigiMeSDK({ applicationId: "test-application-id" });

            sdk.setDummyCredentials();

            await sdk.getAuthorizeUrl({
                callback: "abc",
                state: "",
            });

            expect(true).toBe(false);
        });
    });

    describe.skip(".getOnboardServiceUrl()", () => {
        test("Runs", async () => {
            const sdk = new DigiMeSDK({ applicationId: "test-application-id" });

            sdk.getOnboardServiceUrl();

            expect(true).toBe(false);
        });
    });
});
