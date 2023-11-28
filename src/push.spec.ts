/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import nock from "nock";
import * as SDK from ".";
import { ServerError, TypeValidationError } from "./errors";
import {
    defaultValidDataPush,
    invalidFileMeta,
    validFileMeta,
    validFileMetaStream,
} from "../fixtures/write/example-data-pushes";
import { TEST_BASE_URL, TEST_CUSTOM_BASE_URL, TEST_CUSTOM_ONBOARD_URL } from "../utils/test-constants";
import NodeRSA from "node-rsa";
import { ContractDetails } from "./types/common";
import { URL } from "url";
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
    privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
};

beforeEach(() => {
    nock.cleanAll();
});

describe.each<[string, ReturnType<typeof SDK.init>, string]>([
    ["Default exported SDK", digime, TEST_BASE_URL],
    ["Custom SDK", customSDK, TEST_CUSTOM_BASE_URL],
])("%s", (_title, sdk, baseUrl) => {
    describe("pushData", () => {
        describe("Throws TypeValidationErrors", () => {
            const invalidInputs = [true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")];

            describe("Throws TypeValidationError when contractId is ", () => {
                it.each(invalidInputs)("%p", async (contractId: any) => {
                    const promise = sdk.pushData({
                        ...defaultValidDataPush,
                        contractDetails: {
                            contractId: contractId,
                            privateKey: defaultValidDataPush.contractDetails.privateKey,
                        },
                    });

                    return expect(promise).rejects.toThrowError(TypeValidationError);
                });
            });

            describe("Throws TypeValidationError when privateKey is ", () => {
                it.each(invalidInputs)("%p", async (privateKey: any) => {
                    const promise = sdk.pushData({
                        ...defaultValidDataPush,
                        contractDetails: {
                            ...CONTRACT_DETAILS,
                            privateKey,
                        },
                    });

                    return expect(promise).rejects.toThrowError(TypeValidationError);
                });
            });

            describe("When fileData is", () => {
                const invalidFileDataInput = [...invalidInputs, "non empty strings"];
                it.each(invalidFileDataInput)("%p", (fileData: any) => {
                    expect(
                        sdk.pushData({
                            ...defaultValidDataPush,
                            data: fileData,
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
                    sdk.pushData({
                        ...defaultValidDataPush,
                        data,
                    })
                ).rejects.toThrow(TypeValidationError);
            });
        });

        describe("No errors are thrown when passed in valid data as buffers", () => {
            it.each<[string, any]>([
                ["plain text", validFileMeta.PLAIN_TEXT],
                ["JSON file", validFileMeta.FILE_JSON],
                ["PDF file", validFileMeta.FILE_PDF],
                ["JPG file", validFileMeta.FILE_JPG],
            ])("%p", async (_label, data: any) => {
                nock(`${new URL(baseUrl).origin}`)
                    .post(`${new URL(baseUrl).pathname}permission-access/import`)
                    .reply(200, {
                        status: "delivered",
                        expires: 200000,
                    });

                const response = await sdk.pushData({
                    ...defaultValidDataPush,
                    data,
                });

                expect(response).toBeUndefined();
            });
        });

        describe("No errors are thrown when passed in valid data as stream", () => {
            it.each<[string, any]>([
                ["plain text", validFileMetaStream("PLAIN_TEXT")],
                ["JSON file", validFileMetaStream("FILE_JSON")],
                ["PDF file", validFileMetaStream("FILE_PDF")],
                ["JPG file", validFileMetaStream("FILE_JPG")],
            ])("%p", async (_label, data: any) => {
                nock(`${new URL(baseUrl).origin}`)
                    .post(`${new URL(baseUrl).pathname}permission-access/import`)
                    .reply(201);

                const response = await sdk.pushData({
                    ...defaultValidDataPush,
                    data,
                });
                expect(response).toBeUndefined();
            });
        });

        describe("When given valid input", () => {
            const callback = jest.fn();

            beforeAll(async () => {
                const scope = nock(`${new URL(baseUrl).origin}`)
                    .post(`${new URL(baseUrl).pathname}permission-access/import`)
                    .reply(201);

                // Request event only fires when the scope target has been hit
                scope.on("request", callback);

                await sdk.pushData({ ...defaultValidDataPush });
            });

            it(`Requests target API host and version: ${baseUrl}`, () => {
                expect(callback).toHaveBeenCalledTimes(1);
            });
        });

        describe("When a user token has expired, it tries to refresh it.", () => {
            const refreshCallback = jest.fn();
            const jkuCallback = jest.fn();
            const pushCallback = jest.fn();

            beforeAll(async () => {
                const pushScope = nock(`${new URL(baseUrl).origin}`)
                    .post(`${new URL(baseUrl).pathname}permission-access/import`)
                    .reply(401)
                    .post(`${new URL(baseUrl).pathname}permission-access/import`)
                    .reply(201);

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
                        sub: "test-user-id",
                        consentid: "test-consent-id",
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

                await sdk.pushData({ ...defaultValidDataPush });
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
        });

        describe(`Handles unexpected server side errors`, () => {
            let error: Error;

            beforeAll(async () => {
                nock(`${new URL(baseUrl).origin}`)
                    .post(`${new URL(baseUrl).pathname}permission-access/import`)
                    .reply(404);

                try {
                    await sdk.pushData({ ...defaultValidDataPush });
                } catch (e) {
                    if (!(e instanceof Error)) {
                        throw e;
                    }
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
                    .post(`${new URL(baseUrl).pathname}permission-access/import`)
                    .reply(404, {
                        error: {
                            code: "InvalidRedirectUri",
                            message: "The redirect_uri (${redirectUri}) is invalid",
                            reference: "3Wb9vDEsv4ODYKaoP6lQKCbZu9rnJ6UH",
                        },
                    });

                try {
                    await sdk.pushData({ ...defaultValidDataPush });
                } catch (e) {
                    if (!(e instanceof Error)) {
                        throw e;
                    }
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
