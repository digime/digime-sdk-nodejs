/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import nock from "nock";
import NodeRSA from "node-rsa";
import { URL } from "url";
import { createCAData, loadDefinitions } from "../utils/test-utils";
import { ServerError, TypeValidationError } from "./errors";
import base64url from "base64url";
import { init } from "./init";
import { SAMPLE_TOKEN, TEST_BASE_URL, TEST_CUSTOM_BASE_URL, TEST_CUSTOM_ONBOARD_URL } from "../utils/test-constants";

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

describe.each<[string, ReturnType<typeof init>, string]>([
    ["Default exported SDK", SDK, TEST_BASE_URL],
    ["Custom SDK", customSDK, TEST_CUSTOM_BASE_URL],
])("%s", (_title, sdk, baseUrl) => {
    describe("readAccounts", () => {
        it(`Retrieves data correctly`, async () => {
            const expected = {
                accounts: {
                    id: "4_123456789",
                    name: "test",
                    service: {
                        logo: "https://domain.test/test.png",
                        name: "Instagram",
                    },
                },
            };

            const encryptedData = createCAData(testKeyPair, JSON.stringify(expected.accounts));

            nock(`${new URL(baseUrl).origin}`)
                .get(`${new URL(baseUrl).pathname}permission-access/query/test-session-key/accounts.json`)
                .reply(200, encryptedData, { "x-metadata": base64url.encode(JSON.stringify({})) });

            const result = await sdk.readAccounts({
                sessionKey: "test-session-key",
                privateKey: testKeyPair.exportKey("pkcs1-private"),
                contractId: "test-contract-id",
                userAccessToken: SAMPLE_TOKEN,
            });

            expect(result).toEqual(expected);
        });

        describe("Throws TypeValidationError when sessionKey is", () => {
            it.each([true, false, null, undefined, {}, [], 0, NaN, "", () => null, Symbol("test")])(
                "%p",
                (sessionKey: any) => {
                    // tslint:disable-next-line:max-line-length
                    return expect(
                        sdk.readAccounts({
                            sessionKey,
                            privateKey: testKeyPair.exportKey("pkcs1-private"),
                            contractId: "test-contract-id",
                            userAccessToken: SAMPLE_TOKEN,
                        })
                    ).rejects.toThrow(TypeValidationError);
                }
            );
        });

        describe(`Handles known server side errors`, () => {
            let error: ServerError;

            beforeAll(async () => {
                nock.define(loadDefinitions("fixtures/network/get-session-accounts/bad-request.json"));
                try {
                    await sdk.readAccounts({
                        sessionKey: "test-session-key",
                        privateKey: testKeyPair.exportKey("pkcs1-private"),
                        contractId: "test-contract-id",
                        userAccessToken: SAMPLE_TOKEN,
                    });
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
                return expect(error.message).toEqual("Parameter validation errors");
            });

            it("Error object is the same as from server", () => {
                return expect(error.error).toEqual({
                    code: "ValidationErrors",
                    message: "Parameter validation errors",
                    reference: "3Wb9vDEsv4ODYKaoP6lQKCbZu9rnJ6UH",
                });
            });
        });
    });
});
