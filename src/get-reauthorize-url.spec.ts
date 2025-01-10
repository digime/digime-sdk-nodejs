/*!
 * © World Data Exchange. All rights reserved.
 */

import nock from "nock";
import NodeRSA from "node-rsa";
import {
    TEST_BASE_URL,
    TEST_CUSTOM_BASE_URL,
    TEST_CUSTOM_ONBOARD_URL,
    TEST_ONBOARD_URL,
    SAMPLE_TOKEN,
} from "../utils/test-constants";
import { TypeValidationError } from "./errors";
import { init } from "./init";
import { ContractDetails } from "./types/common";
/* eslint-disable @typescript-eslint/no-explicit-any */

const SDK = init({
    applicationId: "test-application-id",
});

const customSDK = init({
    applicationId: "test-application-id",
    baseUrl: TEST_CUSTOM_BASE_URL,
    onboardUrl: TEST_CUSTOM_ONBOARD_URL,
});

const testKeyPair: NodeRSA = new NodeRSA({ b: 2048 });

beforeEach(() => {
    nock.cleanAll();
});

describe.each<[string, ReturnType<typeof init>, string, string]>([
    ["Default exported SDK", SDK, TEST_BASE_URL, TEST_ONBOARD_URL],
    ["Custom SDK", customSDK, TEST_CUSTOM_BASE_URL, TEST_CUSTOM_ONBOARD_URL],
])("%s", (_title, sdk) => {
    describe("getReauthorizeUrl", () => {
        const CONTRACT_DETAILS: ContractDetails = {
            contractId: "test-contract-id",
            privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
        };

        const CALLBACK_URL = "https://test.callback/";

        describe("Throws TypeValidationError when contractDetails is ", () => {
            it.each([true, false, null, undefined, {}, [], 0, Number.NaN, "", () => null, Symbol("test")])(
                "%p",
                async (contractDetails: any) => {
                    const promise = sdk.getReauthorizeUrl({
                        contractDetails,
                        callback: CALLBACK_URL,
                        state: "test-state",
                        userAccessToken: SAMPLE_TOKEN,
                    });

                    return expect(promise).rejects.toThrow(TypeValidationError);
                }
            );
        });

        describe("Throws TypeValidationError when contractId is ", () => {
            it.each([true, false, null, undefined, {}, [], 0, Number.NaN, "", () => null, Symbol("test")])(
                "%p",
                async (contractId: any) => {
                    const contractDetails = {
                        ...CONTRACT_DETAILS,
                        contractId,
                    };

                    const promise = sdk.getReauthorizeUrl({
                        userAccessToken: SAMPLE_TOKEN,
                        contractDetails,
                        callback: CALLBACK_URL,
                        state: "test-state",
                    });

                    return expect(promise).rejects.toThrow(TypeValidationError);
                }
            );
        });

        describe("Throws TypeValidationError when privateKey is ", () => {
            it.each([true, false, null, undefined, {}, [], 0, Number.NaN, "", () => null, Symbol("test")])(
                "%p",
                async (privateKey: any) => {
                    const contractDetails = {
                        ...CONTRACT_DETAILS,
                        privateKey,
                    };

                    const promise = sdk.getReauthorizeUrl({
                        userAccessToken: SAMPLE_TOKEN,
                        contractDetails,
                        callback: CALLBACK_URL,
                        state: "test-state",
                    });

                    return expect(promise).rejects.toThrow(TypeValidationError);
                }
            );
        });

        describe("Throws TypeValidationError when callback is ", () => {
            it.each([true, false, null, undefined, {}, [], 0, Number.NaN, "", () => null, Symbol("test")])(
                "%p",
                async (callback: any) => {
                    const promise = sdk.getReauthorizeUrl({
                        userAccessToken: SAMPLE_TOKEN,
                        contractDetails: CONTRACT_DETAILS,
                        callback,
                        state: "test-state",
                    });

                    return expect(promise).rejects.toThrow(TypeValidationError);
                }
            );
        });

        describe("Throws TypeValidationError when actions is not an object", () => {
            it.each([true, false, null, [], 0, Number.NaN, "", () => null, Symbol("test")])(
                "%p",
                async (sessionOptions: any) => {
                    const promise = sdk.getReauthorizeUrl({
                        userAccessToken: SAMPLE_TOKEN,
                        contractDetails: CONTRACT_DETAILS,
                        callback: CALLBACK_URL,
                        sessionOptions,
                        state: "test-state",
                    });

                    return expect(promise).rejects.toThrow(TypeValidationError);
                }
            );
        });

        describe("Throws TypeValidationError when scope is a malformed object", () => {
            it.each([
                {
                    timeRanges: ["notAnObject"],
                },
                {
                    serviceGroups: [{ noIdSet: 18 }],
                },
            ])("%p", async (scope: any) => {
                const promise = sdk.getReauthorizeUrl({
                    userAccessToken: SAMPLE_TOKEN,
                    contractDetails: CONTRACT_DETAILS,
                    callback: CALLBACK_URL,
                    sessionOptions: {
                        pull: {
                            scope,
                        },
                    },
                    state: "test-state",
                });

                return expect(promise).rejects.toThrow(TypeValidationError);
            });
        });
    });
});
