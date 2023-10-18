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
} from "./mocks/handlers/discovery/services/handlers";
import { randomUUID } from "node:crypto";

describe("DigiMeSDK", () => {
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
        });

        test("Retries on ENOTFOUND network error", async () => {
            // Alter the base to try and force the ENOTFOUND the network request
            const base = `https://intentionally-unhandled.${randomUUID()}/`;

            // Bind the handler after some unhandled attempts
            let unhandledRequests = 0;

            const unhandledRequestHandler = () => {
                console.log("-handler");
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

        test("Throws with causes on unretryable code", async () => {
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

            sdk.setCredentials();

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
