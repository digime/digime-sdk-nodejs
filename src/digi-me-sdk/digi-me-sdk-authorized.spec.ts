/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { describe, test, expect, vi } from "vitest";
import { DigiMeSdk, DigiMeSdkAuthorized } from "./digi-me-sdk";
import { mockSdkConsumerCredentials } from "../../mocks/sdk-consumer-credentials";
import { handlers as oauthTokenHandlers } from "../../mocks/api/oauth/token/handlers";
import { handlers as permissionAccessAccountsHandlers } from "../../mocks/api/permission-access/accounts/handlers";
import { handlers as permissionAccessQueryHandlers } from "../../mocks/api/permission-access/query/handlers";
import { handlers as userHandlers } from "../../mocks/api/user/handlers";
import { handlers as exportHandlers } from "../../mocks/api/export/handlers";
import { UserAuthorization } from "../user-authorization";
import { mswServer } from "../../mocks/server";
import { DigiMeSdkError, DigiMeSdkTypeError } from "../errors/errors";
import { Readable } from "node:stream";
import { HttpResponse, http } from "msw";
import { fromMockApiBase } from "../../mocks/utilities";

const mockSdkOptions = {
    applicationId: mockSdkConsumerCredentials.applicationId,
    contractId: mockSdkConsumerCredentials.contractId,
    contractPrivateKey: mockSdkConsumerCredentials.privateKeyPkcs1PemString,
} as const satisfies ConstructorParameters<typeof DigiMeSdk>[0];

describe("DigiMeSdkAuthorized", () => {
    describe("Instanced", () => {
        describe("Constructor", () => {
            test("Works with minimum parameters", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);
                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );

                const authorizedSdk = new DigiMeSdkAuthorized({
                    digiMeSdkInstance: sdk,
                    userAuthorization: userAuthorization,
                    onUserAuthorizationUpdated: () => {},
                });

                expect(authorizedSdk).toBeInstanceOf(DigiMeSdkAuthorized);
            });

            test("Throws if provided no arguments", () => {
                expect(
                    // @ts-expect-error Providing wrong type on purpose
                    () => new DigiMeSdkAuthorized(),
                ).toThrowErrorMatchingInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for DigiMeSdkAuthorized constructor parameter "config" (1 issue):
                   • DigiMeSdkAuthorized config is required]
                `);
            });

            test("Throws if `config` argument is not an object", () => {
                expect(
                    // @ts-expect-error Providing wrong type on purpose
                    () => new DigiMeSdkAuthorized(""),
                ).toThrowErrorMatchingInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for DigiMeSdkAuthorized constructor parameter "config" (1 issue):
                   • DigiMeSdkAuthorized config must be an object]
                `);
            });

            test("Throws if `config` argument is an empty object", () => {
                expect(
                    // @ts-expect-error Providing wrong type on purpose
                    () => new DigiMeSdkAuthorized({}),
                ).toThrowErrorMatchingInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for DigiMeSdkAuthorized constructor parameter "config" (3 issues):
                   • "digiMeSdkInstance": Input not instance of DigiMeSdk
                   • "userAuthorization": Input not instance of UserAuthorization
                   • "onUserAuthorizationUpdated": Required]
                `);
            });

            test("Throws if `config` argument is an object with incorrect shape", () => {
                expect(
                    () =>
                        new DigiMeSdkAuthorized({
                            // @ts-expect-error Providing wrong type on purpose
                            digiMeSdkInstance: 1,
                            // @ts-expect-error Providing wrong type on purpose
                            userAuthorization: [],
                            // @ts-expect-error Providing wrong type on purpose
                            onUserAuthorizationUpdated: {},
                        }),
                ).toThrowErrorMatchingInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for DigiMeSdkAuthorized constructor parameter "config" (3 issues):
                   • "digiMeSdkInstance": Input not instance of DigiMeSdk
                   • "userAuthorization": Input not instance of UserAuthorization
                   • "onUserAuthorizationUpdated": Expected function, received object]
                `);
            });
        });

        describe(".refreshUserAuthorization()", () => {
            test("Returns a new `UserAuthorization` instance", async () => {
                mswServer.use(...oauthTokenHandlers);

                const sdk = new DigiMeSdk(mockSdkOptions);
                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );

                const authorizedSdk = new DigiMeSdkAuthorized({
                    digiMeSdkInstance: sdk,
                    userAuthorization: userAuthorization,
                    onUserAuthorizationUpdated: () => {},
                });

                const returnedUserAuthorization = await authorizedSdk.refreshUserAuthorization();

                expect.assertions(2);
                expect(returnedUserAuthorization).toBeInstanceOf(UserAuthorization);
                expect(returnedUserAuthorization).not.toBe(userAuthorization);
            });

            test("Triggers `onUserAuthorizationUpdated` handler correctly", async () => {
                mswServer.use(...oauthTokenHandlers);

                const sdk = new DigiMeSdk(mockSdkOptions);
                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const updateHandler = vi.fn();

                const authorizedSdk = new DigiMeSdkAuthorized({
                    digiMeSdkInstance: sdk,
                    userAuthorization: userAuthorization,
                    onUserAuthorizationUpdated: updateHandler,
                });

                const returnedUserAuthorization = await authorizedSdk.refreshUserAuthorization();

                expect.assertions(5);
                expect(returnedUserAuthorization).toBeInstanceOf(UserAuthorization);
                expect(returnedUserAuthorization).not.toBe(userAuthorization);
                expect(updateHandler).toHaveBeenCalledOnce();
                expect(updateHandler.mock.lastCall[0].oldUserAuthorization).toBe(userAuthorization);
                expect(updateHandler.mock.lastCall[0].newUserAuthorization).toBe(returnedUserAuthorization);
            });

            test("Throws if the UserAuthorization can't be refreshed", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);
                const userAuthorization = UserAuthorization.fromPayload({
                    access_token: {
                        value: "test-access-token",
                        expires_on: 1,
                    },
                    refresh_token: {
                        value: "test-refresh-token",
                        expires_on: 2,
                    },
                    sub: "test-sub",
                });
                const authorizedSdk = new DigiMeSdkAuthorized({
                    digiMeSdkInstance: sdk,
                    userAuthorization: userAuthorization,
                    onUserAuthorizationUpdated: () => {},
                });

                const promise = authorizedSdk.refreshUserAuthorization();

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkError);
                await expect(promise).rejects.toMatchInlineSnapshot(
                    `[DigiMeSdkError: SDK tried to refresh the UserAuthorization that has expired, but the provided UserAuthorization's refresh token has also expired]`,
                );
            });
        });

        describe(".getPortabilityReport()", () => {
            test('Returns a string when `as` is "string"', async () => {
                mswServer.use(...exportHandlers);

                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const sdk = new DigiMeSdk(mockSdkOptions);
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization, () => {});

                const result = await authorizedSdk.getPortabilityReport("string", {
                    serviceType: "medmij",
                    format: "xml",
                });

                expect(result).toEqual(expect.any(String));
            });

            test('Returns a `ReadableStream` when `as` is "ReadableStream"', async () => {
                mswServer.use(...exportHandlers);

                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const sdk = new DigiMeSdk(mockSdkOptions);
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization, () => {});

                const result = await authorizedSdk.getPortabilityReport("ReadableStream", {
                    serviceType: "medmij",
                    format: "xml",
                });

                expect(result).toEqual(expect.any(ReadableStream));
            });

            test('Returns a Node.js `Readable` when `as` is "NodeReadable"', async () => {
                mswServer.use(...exportHandlers);

                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const sdk = new DigiMeSdk(mockSdkOptions);
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization, () => {});

                const result = await authorizedSdk.getPortabilityReport("NodeReadable", {
                    serviceType: "medmij",
                    format: "xml",
                });

                expect(result).toEqual(expect.any(Readable));
            });

            test("Throws if abort signal is triggered", async () => {
                mswServer.use(...exportHandlers);

                const sdk = new DigiMeSdk(mockSdkOptions);
                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization, () => {});
                const signal = AbortSignal.abort();

                const promise = authorizedSdk.getPortabilityReport("string", {
                    serviceType: "medmij",
                    format: "xml",
                    signal,
                });

                await expect(promise).rejects.toBeInstanceOf(Error);
                await expect(promise).rejects.toHaveProperty("name", "AbortError");
            });

            test("Throws if provided no arguments", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);
                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization, () => {});

                // @ts-expect-error Providing wrong type on purpose
                const promise = authorizedSdk.getPortabilityReport();

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`getPortabilityReport\` \`as\` argument (1 issue):
                   • Must be one of: "string", "ReadableStream",  "NodeReadable"]
                `);
            });

            test("Throws if `as` argument is invalid", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);
                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization, () => {});

                // @ts-expect-error Providing wrong type on purpose
                const promise = authorizedSdk.getPortabilityReport(0, {
                    serviceType: "medmij",
                    format: "xml",
                });

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`getPortabilityReport\` \`as\` argument (1 issue):
                   • Must be one of: "string", "ReadableStream",  "NodeReadable"]
                `);
            });

            test("Throws if `options` argument is not an object", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);
                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization, () => {});

                // @ts-expect-error Providing wrong type on purpose
                const promise = authorizedSdk.getPortabilityReport("string", []);

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`getPortabilityReport\` \`options\` argument (1 issue):
                   • Expected object, received array]
                `);
            });

            test("Throws if `options` argument is an empty object", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);
                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization, () => {});

                // @ts-expect-error Providing wrong type on purpose
                const promise = authorizedSdk.getPortabilityReport("string", {});

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`getPortabilityReport\` \`options\` argument (2 issues):
                   • "format": Invalid literal value, expected "xml"
                   • "serviceType": Invalid literal value, expected "medmij"]
                `);
            });

            test("Throws if `options` argument is an object with incorrect shape", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);

                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization, () => {});

                // @ts-expect-error Providing wrong type on purpose
                const promise = authorizedSdk.getPortabilityReport("string", {
                    format: 1,
                    serviceType: [],
                    from: "1",
                    to: null,
                    signal: "",
                });

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`getPortabilityReport\` \`options\` argument (5 issues):
                   • "format": Invalid literal value, expected "xml"
                   • "serviceType": Invalid literal value, expected "medmij"
                   • "from": Expected number, received string
                   • "to": Expected number, received null
                   • "signal": Input not instance of AbortSignal]
                `);
            });

            test("Throws if the API does not return a body", async () => {
                mswServer.use(
                    http.get(fromMockApiBase("export/:serviceType/report"), async () => {
                        return new HttpResponse(undefined, { status: 204 });
                    }),
                );

                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const sdk = new DigiMeSdk(mockSdkOptions);
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization, () => {});

                const promise = authorizedSdk.getPortabilityReport("ReadableStream", {
                    serviceType: "medmij",
                    format: "xml",
                });

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`[DigiMeSdkTypeError: Response contains no body]`);
            });
        });

        describe(".deleteUser()", () => {
            test("Works with no parameters", async () => {
                mswServer.use(...userHandlers);

                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const sdk = new DigiMeSdk(mockSdkOptions);
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization, () => {});

                const result = await authorizedSdk.deleteUser();

                expect(result).toBe(undefined);
            });

            test("Throws if abort signal is triggered", async () => {
                mswServer.use(...userHandlers);

                const sdk = new DigiMeSdk(mockSdkOptions);
                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization, () => {});
                const signal = AbortSignal.abort();

                const promise = authorizedSdk.deleteUser({
                    signal,
                });

                await expect(promise).rejects.toBeInstanceOf(Error);
                await expect(promise).rejects.toHaveProperty("name", "AbortError");
            });

            test("Throws if `parameters` argument is not an object", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);
                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization, () => {});

                // @ts-expect-error Providing wrong type on purpose
                const promise = authorizedSdk.deleteUser([]);

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`deleteUser\` parameters (1 issue):
                   • Expected object, received array]
                `);
            });

            test("Throws if `parameters` argument is an object with incorrect shape", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);

                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization, () => {});

                const promise = authorizedSdk.deleteUser({
                    // @ts-expect-error Providing wrong type on purpose
                    signal: "",
                });

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`deleteUser\` parameters (1 issue):
                   • "signal": Input not instance of AbortSignal]
                `);
            });
        });

        describe(".readAccounts()", () => {
            test("Returns an array of accounts", async () => {
                mswServer.use(...permissionAccessAccountsHandlers);

                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const sdk = new DigiMeSdk(mockSdkOptions);
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization, () => {});

                const promise = authorizedSdk.readAccounts();

                await expect(promise).resolves.toBeInstanceOf(Array);
                await expect(promise).resolves.toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            id: expect.any(String),
                            type: expect.any(String),
                            sourceId: expect.any(Number),
                            createdDate: expect.any(Number),
                            updatedDate: expect.any(Number),
                        }),
                    ]),
                );
            });

            test("Throws if abort signal is triggered", async () => {
                mswServer.use(...permissionAccessAccountsHandlers);

                const sdk = new DigiMeSdk(mockSdkOptions);
                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization, () => {});
                const signal = AbortSignal.abort();

                const promise = authorizedSdk.readAccounts({
                    signal,
                });

                await expect(promise).rejects.toBeInstanceOf(Error);
                await expect(promise).rejects.toHaveProperty("name", "AbortError");
            });

            test("Throws if `parameters` argument is not an object", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);
                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization, () => {});

                const promise = authorizedSdk.readAccounts(
                    // @ts-expect-error Providing wrong type on purpose
                    [],
                );

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`readAcccounts\` parameters (1 issue):
                   • Expected object, received array]
                `);
            });

            test("Throws if `parameters` argument is an object with incorrect shape", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);

                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization, () => {});

                const promise = authorizedSdk.readAccounts({
                    // @ts-expect-error Providing wrong type on purpose
                    signal: "",
                });

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`readAcccounts\` parameters (1 issue):
                   • "signal": Input not instance of AbortSignal]
                `);
            });
        });

        describe(".readFileList()", () => {
            test("Returns the file list", async () => {
                mswServer.use(...permissionAccessQueryHandlers);

                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const sdk = new DigiMeSdk(mockSdkOptions);
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization, () => {});

                const promise = authorizedSdk.readFileList({ sessionKey: "test-session-key" });

                await expect(promise).resolves.toEqual(
                    expect.objectContaining({
                        status: expect.objectContaining({
                            state: expect.any(String),
                        }),
                        fileList: expect.arrayContaining([
                            expect.objectContaining({
                                name: expect.any(String),
                                updatedDate: expect.any(Number),
                            }),
                        ]),
                    }),
                );
            });

            test("Throws if abort signal is triggered", async () => {
                mswServer.use(...permissionAccessQueryHandlers);

                const sdk = new DigiMeSdk(mockSdkOptions);
                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization, () => {});
                const signal = AbortSignal.abort();

                const promise = authorizedSdk.readFileList({ sessionKey: "test-session-key", signal });

                await expect(promise).rejects.toBeInstanceOf(Error);
                await expect(promise).rejects.toHaveProperty("name", "AbortError");
            });

            test("Throws if `parameters` argument is not an object", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);
                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization, () => {});

                const promise = authorizedSdk.readFileList(
                    // @ts-expect-error Providing wrong type on purpose
                    [],
                );

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`readFileList\` parameters (1 issue):
                   • Expected object, received array]
                `);
            });

            test("Throws if `parameters` argument is an object with incorrect shape", async () => {
                const sdk = new DigiMeSdk(mockSdkOptions);

                const userAuthorization = await UserAuthorization.fromJwt(
                    mockSdkConsumerCredentials.userAuthorizationJwt,
                );
                const authorizedSdk = sdk.withUserAuthorization(userAuthorization, () => {});

                const promise = authorizedSdk.readFileList({
                    // @ts-expect-error Providing wrong type on purpose
                    sessionKey: [],
                    // @ts-expect-error Providing wrong type on purpose
                    signal: "",
                });

                await expect(promise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
                await expect(promise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`readFileList\` parameters (2 issues):
                   • "sessionKey": Expected string, received array
                   • "signal": Input not instance of AbortSignal]
                `);
            });
        });
    });
});
