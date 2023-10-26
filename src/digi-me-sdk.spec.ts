/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { describe, test, expect } from "vitest";
import { DigiMeSDK } from "./index";
import { mswServer } from "./mocks/server";
import {
    discoveryServicesCodeErrorHandler,
    discoveryServicesErrorAcceptHeaderHandler,
    discoveryServicesHandler,
} from "./mocks/api/discovery/services/handlers";
import { randomUUID } from "node:crypto";
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
        test("Succeeds", async () => {
            mswServer.use(discoveryServicesHandler());

            const sdk = new DigiMeSDK({ applicationId: "test-application-id" });

            await expect(sdk.getAvailableServices()).resolves.toMatchObject({
                countries: expect.anything(),
                services: expect.anything(),
                serviceGroups: expect.anything(),
            });
        });

        test("Retries on 500 error code", async () => {
            mswServer.use(discoveryServicesCodeErrorHandler({ errorCode: 500 }), discoveryServicesHandler());

            const sdk = new DigiMeSDK({ applicationId: "test-application-id" });

            await expect(sdk.getAvailableServices()).resolves.toMatchObject({
                countries: expect.anything(),
                services: expect.anything(),
                serviceGroups: expect.anything(),
            });

            expect(mswServer.listHandlers()).toMatchObject([{ isUsed: true }, { isUsed: true }]);
        });

        test("Retries on ENOTFOUND network error", async () => {
            // Alter the base to try and force the ENOTFOUND the network request
            const base = `https://intentionally-unhandled.${randomUUID()}/` as const;

            // Bind the handler after some unhandled attempts
            let unhandledRequests = 0;

            const unhandledRequestHandler = () => {
                unhandledRequests++;

                if (unhandledRequests >= 2) {
                    mswServer.use(discoveryServicesHandler({ base }));
                }
            };

            const emitter = mswServer.events.on("request:unhandled", unhandledRequestHandler);
            const sdk = new DigiMeSDK({ baseURL: base, applicationId: "test-application-id" });

            await expect(sdk.getAvailableServices()).resolves.toMatchObject({
                countries: expect.anything(),
                services: expect.anything(),
                serviceGroups: expect.anything(),
            });

            mswServer.events.removeListener("request:unhandled", unhandledRequestHandler);

            // Ensure listener was removed
            expect(emitter.listenerCount("request:unhandled")).toBe(0);
        });

        test.skip("Throws with causes on unretryable code", async () => {
            mswServer.use(discoveryServicesErrorAcceptHeaderHandler());

            const sdk = new DigiMeSDK({ applicationId: "test-application-id" });

            const promise = sdk.getAvailableServices();

            await expect(promise).rejects.toThrowError(Error);
            await expect(promise).rejects.toThrowError("Network request failed");
            await expect(promise).rejects.toMatchObject({
                cause: expect.objectContaining({
                    message: expect.stringContaining("Received unexpected response from the API"),
                    cause: expect.objectContaining({
                        name: expect.stringContaining("ZodError"),
                    }),
                }),
            });

            expect.assertions(3);
        });
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
