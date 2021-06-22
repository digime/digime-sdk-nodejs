/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import nock = require("nock");
import * as SDK from ".";
import { ServerError, TypeValidationError } from "./errors";
import { defaultValidDataPush, invalidFileMeta, validFileMeta } from "../fixtures/postbox/example-data-pushes";
import { SAMPLE_TOKEN, TEST_BASE_URL, TEST_CUSTOM_BASE_URL, TEST_CUSTOM_ONBOARD_URL } from "../utils/test-constants";
import NodeRSA = require("node-rsa");
import { ContractDetails } from "./types/common";
import { URL } from "url";
import { WriteResponse } from "./write";
import { sign } from "jsonwebtoken";
import { HTTPError } from "got/dist/source";

/* eslint-disable @typescript-eslint/no-explicit-any */

const digime = SDK.init({
    applicationId: "test-application-id",
});

const customSDK = SDK.init({
    applicationId: "test-application-id",
    baseUrl: TEST_CUSTOM_BASE_URL,
    onboardUrl: TEST_CUSTOM_ONBOARD_URL,
});

const testKeyPair: NodeRSA = new NodeRSA({ b: 2048 });

const CONTRACT_DETAILS: ContractDetails = {
    contractId: "test-contract-id",
    redirectUri: "test-redirect-url",
    privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
};

beforeEach(() => {
    nock.cleanAll();
});

describe.each<[string, ReturnType<typeof SDK.init>, string]>([
    ["Default exported SDK", digime, TEST_BASE_URL],
    ["Custom SDK", customSDK, TEST_CUSTOM_BASE_URL],
])("%s", (_title, sdk, baseUrl) => {
    describe("write", () => {
        describe("Throws TypeValidationErrors", () => {
            const invalidInputs = [true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")];

            describe("Throws TypeValidationError when contractId is ", () => {
                it.each(invalidInputs)("%p", async (contractId: any) => {
                    const promise = sdk.write({
                        ...defaultValidDataPush,
                        contractDetails: {
                            ...CONTRACT_DETAILS,
                            contractId,
                        },
                    });

                    return expect(promise).rejects.toThrowError(TypeValidationError);
                });
            });

            describe("Throws TypeValidationError when redirectUri is ", () => {
                it.each(invalidInputs)("%p", async (redirectUri: any) => {
                    const promise = sdk.write({
                        ...defaultValidDataPush,
                        contractDetails: {
                            ...CONTRACT_DETAILS,
                            redirectUri,
                        },
                    });

                    return expect(promise).rejects.toThrowError(TypeValidationError);
                });
            });

            describe("Throws TypeValidationError when privateKey is ", () => {
                it.each(invalidInputs)("%p", async (privateKey: any) => {
                    const promise = sdk.write({
                        ...defaultValidDataPush,
                        contractDetails: {
                            ...CONTRACT_DETAILS,
                            privateKey,
                        },
                    });

                    return expect(promise).rejects.toThrowError(TypeValidationError);
                });
            });

            describe("When postboxId is", () => {
                it.each(invalidInputs)("%p", (postboxId: any) => {
                    const promise = sdk.write({
                        ...defaultValidDataPush,
                        postboxId,
                    });
                    return expect(promise).rejects.toThrowError(TypeValidationError);
                });
            });

            describe("When publicKey is", () => {
                it.each(invalidInputs)("%p", (publicKey: any) => {
                    const promise = sdk.write({
                        ...defaultValidDataPush,
                        publicKey,
                    });
                    return expect(promise).rejects.toThrowError(TypeValidationError);
                });
            });

            describe("When fileData is", () => {
                const invalidFileDataInput = [...invalidInputs, "non empty strings"];
                it.each(invalidFileDataInput)("%p", (fileData: any) => {
                    expect(
                        sdk.write({
                            ...defaultValidDataPush,
                            data: {
                                ...defaultValidDataPush.data,
                                fileData,
                            },
                        })
                    ).rejects.toThrow(TypeValidationError);
                });
            });
        });

        describe("Throws errors are thrown when file meta passed is invalid", () => {
            it.each<[string, any]>([
                ["with missing file descriptor", invalidFileMeta.MISSING_FILE_DESCRIPTOR],
                ["with data that is not a buffer", invalidFileMeta.NON_BUFFER_FILE_DATA],
                ["with data that is a base64 string", invalidFileMeta.BASE_64_FILE_DATA],
                ["with missing file name", invalidFileMeta.MISSING_FILE_NAME],
            ])("%p", async (_label, data: any) => {
                expect(
                    sdk.write({
                        ...defaultValidDataPush,
                        data,
                    })
                ).rejects.toThrow(TypeValidationError);
            });
        });

        describe("No errors are thrown when passed in valid", () => {
            it.each<[string, any]>([
                ["plain text", validFileMeta.PLAIN_TEXT],
                ["JSON file", validFileMeta.FILE_JSON],
                ["PDF file", validFileMeta.FILE_PDF],
                ["JPG file", validFileMeta.FILE_PDF],
            ])("%p", async (_label, data: any) => {
                nock(`${new URL(baseUrl).origin}`)
                    .post(`${new URL(baseUrl).pathname}permission-access/postbox/test-postbox-id`)
                    .reply(200, {
                        status: "delivered",
                        expires: 200000,
                    });

                const response = await sdk.write({
                    ...defaultValidDataPush,
                    data,
                });

                expect(response).toBeDefined();
            });
        });

        describe("When given valid input", () => {
            let response: WriteResponse;
            const callback = jest.fn();

            beforeAll(async () => {
                const scope = nock(`${new URL(baseUrl).origin}`)
                    .post(`${new URL(baseUrl).pathname}permission-access/postbox/test-postbox-id`)
                    .reply(200, {
                        status: "delivered",
                        expires: 200000,
                    });

                // Request event only fires when the scope target has been hit
                scope.on("request", callback);

                response = await sdk.write(defaultValidDataPush);
            });

            it(`Requests target API host and version: ${baseUrl}`, () => {
                expect(callback).toHaveBeenCalledTimes(1);
            });

            it(`Returns push status in the response`, () => {
                expect(response.status).toEqual("delivered");
            });

            it(`Returns user access token to be returned in the response`, () => {
                expect(response.userAccessToken).toEqual(SAMPLE_TOKEN);
            });

            it(`Returns expiry in the response`, () => {
                expect(response.expires).toEqual(200000);
            });
        });

        describe("When a user token has expired, it tries to refresh it.", () => {
            const refreshCallback = jest.fn();
            const jkuCallback = jest.fn();
            const pushCallback = jest.fn();
            let response: unknown;

            beforeAll(async () => {
                const pushScope = nock(`${new URL(baseUrl).origin}`)
                    .post(`${new URL(baseUrl).pathname}permission-access/postbox/${defaultValidDataPush.postboxId}`)
                    .reply(200, {
                        status: "pending",
                        expires: 200000,
                    })
                    .post(`${new URL(baseUrl).pathname}permission-access/postbox/${defaultValidDataPush.postboxId}`)
                    .reply(200, {
                        status: "delivered",
                        expires: 200000,
                    });

                const jwt: string = sign(
                    {
                        access_token: {
                            expires_on: 1000000,
                            value: "refreshed-sample-token",
                        },
                        refresh_token: {
                            expires_on: 1000000,
                            value: "refreshed-refresh-token",
                        },
                    },
                    testKeyPair.exportKey("pkcs1-private-pem"),
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

                const refreshScope = nock(`${new URL(baseUrl).origin}`)
                    .post(`${new URL(baseUrl).pathname}oauth/token`)
                    .reply(201, {
                        token: jwt,
                    });

                const verifyJKUScope = nock(`${new URL(baseUrl).origin}`)
                    .get(`${new URL(baseUrl).pathname}test-jku-url`)
                    .reply(201, {
                        keys: [
                            {
                                kid: "test-kid",
                                pem: testKeyPair.exportKey("pkcs1-public"),
                            },
                        ],
                    });

                pushScope.on("request", pushCallback);
                refreshScope.on("request", refreshCallback);
                verifyJKUScope.on("request", jkuCallback);

                response = await sdk.write(defaultValidDataPush);
            });

            it(`Refresh endpoint is called`, async () => {
                expect(refreshCallback).toHaveBeenCalledTimes(1);
            });

            it(`Push endpoint is called twice`, async () => {
                expect(pushCallback).toHaveBeenCalledTimes(2);
            });

            it(`jku verification endpoint is called`, async () => {
                expect(jkuCallback).toHaveBeenCalledTimes(1);
            });

            it(`Returns push status and new user tokens in the response`, async () => {
                expect(response).toEqual({
                    status: "delivered",
                    expires: 200000,
                    userAccessToken: {
                        accessToken: {
                            expiry: 1000000,
                            value: "refreshed-sample-token",
                        },
                        refreshToken: {
                            expiry: 1000000,
                            value: "refreshed-refresh-token",
                        },
                    },
                });
            });
        });

        describe(`Handles unexpected server side errors`, () => {
            let error: Error;

            beforeAll(async () => {
                nock(`${new URL(baseUrl).origin}`)
                    .post(`${new URL(baseUrl).pathname}permission-access/postbox/test-postbox-id`)
                    .reply(404);

                try {
                    await sdk.write(defaultValidDataPush);
                } catch (e) {
                    error = e;
                }
            });

            it("Throws HTTPError when we get an error from the call", async () => {
                return expect(error).toBeInstanceOf(HTTPError);
            });
        });

        describe(`Handles known server side errors`, () => {
            let error: ServerError;

            beforeAll(async () => {
                nock(`${new URL(baseUrl).origin}`)
                    .post(`${new URL(baseUrl).pathname}permission-access/postbox/test-postbox-id`)
                    .reply(404, {
                        error: {
                            code: "InvalidRedirectUri",
                            message: "The redirect_uri (${redirectUri}) is invalid",
                            reference: "3Wb9vDEsv4ODYKaoP6lQKCbZu9rnJ6UH",
                        },
                    });

                try {
                    await sdk.write(defaultValidDataPush);
                } catch (e) {
                    error = e;
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
                });
            });
        });
    });
});
