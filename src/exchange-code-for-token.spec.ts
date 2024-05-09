/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import nock from "nock";
import NodeRSA from "node-rsa";
import { URL } from "url";
import * as SDK from ".";
import { SAMPLE_TOKEN, TEST_BASE_URL, TEST_CUSTOM_BASE_URL, TEST_CUSTOM_ONBOARD_URL } from "../utils/test-constants";
import { TypeValidationError } from "./errors";
import { ContractDetails } from "./types/common";
import { sign } from "jsonwebtoken";
import { UserAccessToken, UserAccessTokenCodec } from "./types/user-access-token";

/* eslint-disable @typescript-eslint/no-explicit-any */
jest.mock("./utils/sleep");

const digime = SDK.init({
    applicationId: "test-application-id",
});

const customSDK = SDK.init({
    applicationId: "test-application-id",
    baseUrl: TEST_CUSTOM_BASE_URL,
    onboardUrl: TEST_CUSTOM_ONBOARD_URL,
});

const testKeyPair: NodeRSA = new NodeRSA({ b: 2048 });

beforeEach(() => {
    nock.cleanAll();
});

const CONTRACT_DETAILS: ContractDetails = {
    contractId: "test-contract-id",
    privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
};

const SAMPLE_CODE = "sample-code";
const SAMPLE_CODE_VERIFIER = "sample-verifier";

describe.each<[string, ReturnType<typeof SDK.init>, string]>([
    ["Default exported SDK", digime, TEST_BASE_URL],
    ["Custom SDK", customSDK, TEST_CUSTOM_BASE_URL],
])("%s", (_title, sdk, baseUrl) => {
    describe("Throws TypeValidationError when contractDetails is ", () => {
        it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
            "%p",
            async (contractDetails: any) => {
                const promise = sdk.exchangeCodeForToken({
                    contractDetails,
                    authorizationCode: SAMPLE_CODE,
                    codeVerifier: SAMPLE_CODE_VERIFIER,
                });

                return expect(promise).rejects.toThrowError(TypeValidationError);
            }
        );
    });

    describe("Throws TypeValidationError when contractId is ", () => {
        it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
            "%p",
            async (contractId: any) => {
                const promise = sdk.exchangeCodeForToken({
                    contractDetails: {
                        ...CONTRACT_DETAILS,
                        contractId,
                    },
                    authorizationCode: SAMPLE_CODE,
                    codeVerifier: SAMPLE_CODE_VERIFIER,
                });

                return expect(promise).rejects.toThrowError(TypeValidationError);
            }
        );
    });

    describe("Throws TypeValidationError when privateKey is ", () => {
        it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
            "%p",
            async (privateKey: any) => {
                const promise = sdk.exchangeCodeForToken({
                    contractDetails: {
                        ...CONTRACT_DETAILS,
                        privateKey,
                    },
                    authorizationCode: SAMPLE_CODE,
                    codeVerifier: SAMPLE_CODE_VERIFIER,
                });

                return expect(promise).rejects.toThrowError(TypeValidationError);
            }
        );
    });

    describe("Throws TypeValidationError when codeVerifier is ", () => {
        it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
            "%p",
            async (codeVerifier: any) => {
                const promise = sdk.exchangeCodeForToken({
                    contractDetails: CONTRACT_DETAILS,
                    authorizationCode: SAMPLE_CODE,
                    codeVerifier,
                });

                return expect(promise).rejects.toThrowError(TypeValidationError);
            }
        );
    });

    describe("Throws TypeValidationError when authorizationCode is ", () => {
        it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
            "%p",
            async (authorizationCode: any) => {
                const promise = sdk.exchangeCodeForToken({
                    contractDetails: CONTRACT_DETAILS,
                    authorizationCode,
                    codeVerifier: SAMPLE_CODE_VERIFIER,
                });

                return expect(promise).rejects.toThrowError(TypeValidationError);
            }
        );
    });

    describe(`exchangeCodeForToken returns successfully`, () => {
        let token: UserAccessToken;

        beforeAll(async () => {
            const jwt: string = sign(
                {
                    access_token: {
                        expires_on: 1000000,
                        value: "sample-token",
                    },
                    refresh_token: {
                        expires_on: 1000000,
                        value: "sample-refresh-token",
                    },
                    sub: "test-user-id",
                    consentid: "test-consent-id",
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

            nock(`${new URL(baseUrl).origin}`)
                .post(`${new URL(baseUrl).pathname}oauth/token`)
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

            token = await sdk.exchangeCodeForToken({
                contractDetails: CONTRACT_DETAILS,
                authorizationCode: SAMPLE_CODE,
                codeVerifier: SAMPLE_CODE_VERIFIER,
            });
        });

        it("returns an object of type UserAccessToken", () => {
            expect(UserAccessTokenCodec.is(token)).toBe(true);
        });

        it("returns token to have expected values", () => {
            expect(token).toEqual(SAMPLE_TOKEN);
        });
    });
});
