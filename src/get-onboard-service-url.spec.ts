/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import nock from "nock";
import NodeRSA from "node-rsa";
import { URL } from "node:url";
import {
    SAMPLE_TOKEN,
    TEST_BASE_URL,
    TEST_CUSTOM_BASE_URL,
    TEST_CUSTOM_ONBOARD_URL,
    TEST_ONBOARD_URL,
} from "../utils/test-constants";
import { ServerError, TypeValidationError } from "./errors";
import { init } from "./init";
import { ContractDetails } from "./types/common";
import { sign } from "jsonwebtoken";
import { HTTPError } from "got/dist/source";
import { GetOnboardServiceUrlResponse } from "./get-onboard-service-url";

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
])("%s", (_title, sdk, baseUrl, saasUrl) => {
    describe("getOnboardServiceUrl", () => {
        const CONTRACT_DETAILS: ContractDetails = {
            contractId: "test-contract-id",
            privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
        };

        const CALLBACK_URL = "https://test.callback/";

        describe("Throws TypeValidationError when contractDetails is ", () => {
            it.each([true, false, null, undefined, {}, [], 0, Number.NaN, "", () => null, Symbol("test")])(
                "%p",
                async (contractDetails: any) => {
                    const promise = sdk.getOnboardServiceUrl({
                        contractDetails,
                        serviceId: 99,
                        userAccessToken: SAMPLE_TOKEN,
                        callback: CALLBACK_URL,
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

                    const promise = sdk.getOnboardServiceUrl({
                        contractDetails,
                        serviceId: 99,
                        userAccessToken: SAMPLE_TOKEN,
                        callback: CALLBACK_URL,
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

                    const promise = sdk.getOnboardServiceUrl({
                        contractDetails,
                        serviceId: 99,
                        userAccessToken: SAMPLE_TOKEN,
                        callback: CALLBACK_URL,
                    });

                    return expect(promise).rejects.toThrow(TypeValidationError);
                }
            );
        });

        describe("Throws TypeValidationError when callback is ", () => {
            it.each([true, false, null, undefined, {}, [], 0, Number.NaN, "", () => null, Symbol("test")])(
                "%p",
                async (callback: any) => {
                    const promise = sdk.getOnboardServiceUrl({
                        contractDetails: CONTRACT_DETAILS,
                        serviceId: 99,
                        userAccessToken: SAMPLE_TOKEN,
                        callback,
                    });

                    return expect(promise).rejects.toThrow(TypeValidationError);
                }
            );
        });

        describe("Throws TypeValidationError when serviceId is ", () => {
            it.each([true, false, null, {}, [], "", () => null, Symbol("test")])("%p", async (serviceId: any) => {
                const promise = sdk.getOnboardServiceUrl({
                    contractDetails: CONTRACT_DETAILS,
                    serviceId,
                    userAccessToken: SAMPLE_TOKEN,
                    callback: CALLBACK_URL,
                });

                return expect(promise).rejects.toThrow(TypeValidationError);
            });
        });

        describe(`getOnboardServiceUrl with minimum props`, () => {
            let response: GetOnboardServiceUrlResponse;
            beforeAll(async () => {
                const jwt: string = sign(
                    {
                        reference_code: "test-reference-code",
                    },
                    testKeyPair.exportKey("pkcs1-private-pem").toString(),
                    {
                        algorithm: "PS512",
                        noTimestamp: true,
                        header: {
                            alg: "PS512",
                            jku: `${baseUrl}test-jku-url`,
                            kid: "test-kid",
                        },
                    }
                );

                nock(new URL(baseUrl).origin)
                    .post(`${new URL(baseUrl).pathname}oauth/token/reference`)
                    .reply(201, {
                        token: jwt,
                    })
                    .get(`${new URL(baseUrl).pathname}test-jku-url`)
                    .reply(201, {
                        keys: [
                            {
                                kid: "test-kid",
                                pem: testKeyPair.exportKey("pkcs1-public"),
                            },
                        ],
                    });

                response = await sdk.getOnboardServiceUrl({
                    contractDetails: CONTRACT_DETAILS,
                    serviceId: 99,
                    userAccessToken: SAMPLE_TOKEN,
                    callback: CALLBACK_URL,
                });
            });

            it("returns an object with a link", () => {
                expect(response.url).toBeDefined();
            });

            it("returned link uses the onboard url as origin", () => {
                expect(new URL(response.url).origin).toEqual(new URL(saasUrl).origin);
            });

            it("returned link contains correct code", () => {
                expect(new URL(response.url).searchParams.get("code")).toEqual("test-reference-code");
            });

            it("returned link contains service Id", () => {
                expect(new URL(response.url).searchParams.get("service")).toEqual("99");
            });

            it("returns the same user access token", () => {
                expect(response.userAccessToken).toEqual(SAMPLE_TOKEN);
            });
        });

        describe(`Handles known server side errors`, () => {
            let error: ServerError;

            beforeAll(async () => {
                nock(new URL(baseUrl).origin)
                    .post(`${new URL(baseUrl).pathname}oauth/token/reference`)
                    .reply(404, {
                        error: {
                            code: "InvalidRedirectUri",
                            message: "The redirect_uri (${redirectUri}) is invalid",
                            reference: "3Wb9vDEsv4ODYKaoP6lQKCbZu9rnJ6UH",
                        },
                    });

                try {
                    await sdk.getOnboardServiceUrl({
                        contractDetails: CONTRACT_DETAILS,
                        serviceId: 99,
                        userAccessToken: SAMPLE_TOKEN,
                        callback: CALLBACK_URL,
                    });
                } catch (error_) {
                    if (!(error_ instanceof Error)) {
                        throw error_;
                    }
                    error = error_;
                }
            });

            it("Throws ServerError when we get an standard server error message from the server", () => {
                return expect(error).toBeInstanceOf(ServerError);
            });

            it("Error message is the same as from server", () => {
                return expect(error.message).toEqual("The redirect_uri (${redirectUri}) is invalid");
            });

            it("Error object is the same as from server", () => {
                return expect(error.error).toEqual({
                    code: "InvalidRedirectUri",
                    message: "The redirect_uri (${redirectUri}) is invalid",
                    reference: "3Wb9vDEsv4ODYKaoP6lQKCbZu9rnJ6UH",
                    statusCode: 404,
                    statusMessage: "Not Found",
                });
            });
        });

        describe(`Handles unexpected server side errors`, () => {
            let error: Error;

            beforeAll(async () => {
                nock(new URL(baseUrl).origin)
                    .post(`${new URL(baseUrl).pathname}oauth/token/reference`)
                    .reply(404);

                try {
                    await sdk.getOnboardServiceUrl({
                        contractDetails: CONTRACT_DETAILS,
                        serviceId: 99,
                        userAccessToken: SAMPLE_TOKEN,
                        callback: CALLBACK_URL,
                    });
                } catch (error_) {
                    if (!(error_ instanceof Error)) {
                        throw error_;
                    }
                    error = error_;
                }
            });

            it("Throws HTTPError when we get an error from the call", () => {
                return expect(error).toBeInstanceOf(HTTPError);
            });
        });
    });
});
