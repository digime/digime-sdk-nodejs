/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import nock from "nock";
import {
    TEST_BASE_URL,
    TEST_CUSTOM_BASE_URL,
    TEST_CUSTOM_ONBOARD_URL,
    TEST_ONBOARD_URL,
} from "../utils/test-constants";
import { TypeValidationError } from "./errors";
import { init } from "./init";
import { loadDefinitions } from "../utils/test-utils";
import { GetAvailableServicesResponse } from "./get-available-services";
import get from "lodash.get";

/* eslint-disable @typescript-eslint/no-explicit-any */

const SDK = init({
    applicationId: "test-application-id",
});

const customSDK = init({
    applicationId: "test-application-id",
    baseUrl: TEST_CUSTOM_BASE_URL,
    onboardUrl: TEST_CUSTOM_ONBOARD_URL,
});

beforeEach(() => {
    nock.cleanAll();
});

describe.each<[string, ReturnType<typeof init>, string, string]>([
    ["Default exported SDK", SDK, TEST_BASE_URL, TEST_ONBOARD_URL],
    ["Custom SDK", customSDK, TEST_CUSTOM_BASE_URL, TEST_CUSTOM_ONBOARD_URL],
])("%s", (_title, sdk) => {
    describe("getAvailableServices", () => {
        describe("Throws TypeValidationError when contractId is ", () => {
            it.each([true, false, null, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                "%p",
                async (contract: any) => {
                    return expect(sdk.getAvailableServices(contract)).rejects.toThrowError(TypeValidationError);
                }
            );
        });

        describe("Formats response correctly", () => {
            let response: GetAvailableServicesResponse;
            beforeAll(async () => {
                nock.define(loadDefinitions("fixtures/network/get-available-services/valid-response.json"));

                response = await sdk.getAvailableServices();
            });

            it("returned object contains a country object", () => {
                expect(response.countries).toBeDefined();
            });

            it("returned object contains a serviceGroups object", () => {
                expect(response.serviceGroups).toBeDefined();
            });

            it("returned object contains a services object", () => {
                expect(response.services).toBeDefined();
            });

            it.each(["authorisation", "platform", "providerId", "reference", "serviceId", "sync"])(
                "none of the services return contain property %p",
                (property) => {
                    expect(response.services.every((service) => get(service, [property]) === undefined)).toBe(true);
                }
            );
        });
    });
});
