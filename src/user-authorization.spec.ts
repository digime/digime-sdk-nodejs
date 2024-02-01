/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { describe, test, expect } from "vitest";
import { UserAuthorization } from "./user-authorization";
import { DigiMeSdkError } from "./errors/errors";
import type { LegacyUserAuthorizationPayload, UserAuthorizationPayload } from "./types/external/oauth-token";
import { mockApiInternals } from "../mocks/api-internals";

const DAY_IN_SECONDS = 86400;
const DAY_IN_MILISECONDS = DAY_IN_SECONDS * 1000;

const SAMPLE_PAYLOAD = {
    access_token: {
        value: "test-access-token",
        expires_on: Math.round(Date.now() / 1000) + DAY_IN_SECONDS,
    },
    refresh_token: {
        value: "test-refresh-token",
        expires_on: Math.round(Date.now() / 1000) + DAY_IN_SECONDS * 7,
    },
    sub: "test-sub",
} as const satisfies UserAuthorizationPayload;

const SAMPLE_PAYLOAD_EXPIRED = {
    access_token: {
        value: "test-access-token",
        expires_on: 1,
    },
    refresh_token: {
        value: "test-refresh-token",
        expires_on: 2,
    },
    sub: "test-sub",
} as const satisfies UserAuthorizationPayload;

const SAMPLE_LEGACY_PAYLOAD = {
    accessToken: {
        value: SAMPLE_PAYLOAD.access_token.value,
        expiry: SAMPLE_PAYLOAD.access_token.expires_on,
    },
    refreshToken: {
        value: SAMPLE_PAYLOAD.refresh_token.value,
        expiry: SAMPLE_PAYLOAD.refresh_token.expires_on,
    },
    user: {
        id: SAMPLE_PAYLOAD.sub,
    },
} as const satisfies LegacyUserAuthorizationPayload;

describe("UserAuthorization", () => {
    test("Can't directly instantiate", () => {
        const testFunction = () => {
            // @ts-expect-error Providing no parameters to the constructor on purpose
            new UserAuthorization();
        };

        expect(testFunction).toThrowError(DigiMeSdkError);
        expect(testFunction).toThrowErrorMatchingInlineSnapshot(`
          [DigiMeSdkError: \`UserAuthorization\` should not be instantiated manually. Instead, use one of these static methods to get an instance:
           - UserAuthorization.fromJwt()
           - UserAuthorization.fromPayload()
           - UserAuthorization.fromJsonPayload()
          ]
        `);
    });

    describe("Can instantiate from", () => {
        test("JWT", async () => {
            const testToken = await mockApiInternals.signTokenPayload(SAMPLE_PAYLOAD);
            const instance = await UserAuthorization.fromJwt(testToken);

            expect(instance).toBeInstanceOf(UserAuthorization);
            expect(instance.asPayload()).toMatchObject(SAMPLE_PAYLOAD);
        });

        test("Payload", () => {
            const instance = UserAuthorization.fromPayload(SAMPLE_PAYLOAD);

            expect(instance).toBeInstanceOf(UserAuthorization);
            expect(instance.asPayload()).toMatchObject(SAMPLE_PAYLOAD);
        });

        test("JSON Payload", () => {
            const instance = UserAuthorization.fromJsonPayload(JSON.stringify(SAMPLE_PAYLOAD));

            expect(instance).toBeInstanceOf(UserAuthorization);
            expect(instance.asPayload()).toMatchObject(SAMPLE_PAYLOAD);
        });

        test("Legacy Payload", () => {
            const instance = UserAuthorization.fromLegacyPayload(SAMPLE_LEGACY_PAYLOAD);

            expect(instance).toBeInstanceOf(UserAuthorization);
            expect(instance.asPayload()).toMatchObject(SAMPLE_PAYLOAD);
        });

        test("Legacy JSON Payload", () => {
            const instance = UserAuthorization.fromLegacyJsonPayload(JSON.stringify(SAMPLE_LEGACY_PAYLOAD));

            expect(instance).toBeInstanceOf(UserAuthorization);
            expect(instance.asPayload()).toMatchObject(SAMPLE_PAYLOAD);
        });
    });

    describe("Can get as", () => {
        test.todo("JWT", () => {
            // const instance = UserAuthorization.fromPayload(testPayload);
            // expect(instance.asJwt())
        });

        test("Payload", () => {
            const instance = UserAuthorization.fromPayload(SAMPLE_PAYLOAD);
            expect(instance.asPayload()).toMatchObject(SAMPLE_PAYLOAD);
        });

        test("JSON Payload", () => {
            const instance = UserAuthorization.fromPayload(SAMPLE_PAYLOAD);
            const jsonPayload = instance.asJsonPayload();
            expect(jsonPayload).toEqual(expect.any(String));
            expect(JSON.parse(jsonPayload)).toMatchObject(SAMPLE_PAYLOAD);
        });

        test("Legacy Payload", () => {
            const instance = UserAuthorization.fromPayload(SAMPLE_PAYLOAD);
            expect(instance.asLegacyPayload()).toMatchObject(SAMPLE_LEGACY_PAYLOAD);
        });

        test("Legacy JSON Payload", () => {
            const instance = UserAuthorization.fromPayload(SAMPLE_PAYLOAD);
            const jsonPayload = instance.asLegacyJsonPayload();
            expect(jsonPayload).toEqual(expect.any(String));
            expect(JSON.parse(jsonPayload)).toMatchObject(SAMPLE_LEGACY_PAYLOAD);
        });
    });

    describe(".isUsable()", () => {
        test("Returns `true` when access token expires in the future", () => {
            const instance = UserAuthorization.fromPayload(SAMPLE_PAYLOAD);
            const result = instance.isUsable();

            expect(result).toBe(true);
        });

        test("Returns `false` when access token expires in the past", () => {
            const instance = UserAuthorization.fromPayload(SAMPLE_PAYLOAD_EXPIRED);
            const result = instance.isUsable();

            expect(result).toBe(false);
        });

        describe("`tolerance` argument", () => {
            test("Returns `false` if tolerance makes the access token expiry in the past", () => {
                const instance = UserAuthorization.fromPayload(SAMPLE_PAYLOAD);
                const result = instance.isUsable(DAY_IN_MILISECONDS * 2);

                expect(result).toBe(false);
            });

            test("Returns `true` if tolerance is 0", () => {
                const instance = UserAuthorization.fromPayload(SAMPLE_PAYLOAD);
                const result = instance.isUsable(0);

                expect(result).toBe(true);
            });

            test("Throws if `tolerance` is a type other than a number", () => {
                const instance = UserAuthorization.fromPayload(SAMPLE_PAYLOAD);

                expect(() =>
                    instance.isUsable(
                        // @ts-expect-error Providing wrong type on purpose
                        "10000",
                    ),
                ).toThrowErrorMatchingInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`tolerance\` argument (1 issue):
                   • Expected number, received string]
                `);
            });

            test("Throws if `tolerance` is `NaN`", () => {
                const instance = UserAuthorization.fromPayload(SAMPLE_PAYLOAD);

                expect(() => instance.isUsable(NaN)).toThrowErrorMatchingInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`tolerance\` argument (1 issue):
                   • Expected number, received nan]
                `);
            });

            test("Throws if `tolerance` is a negative number", () => {
                const instance = UserAuthorization.fromPayload(SAMPLE_PAYLOAD);

                expect(() => instance.isUsable(-10000)).toThrowErrorMatchingInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`tolerance\` argument (1 issue):
                   • Number must be greater than or equal to 0]
                `);
            });
        });

        describe("`now` argument", () => {
            test("Returns `false` if `now` is sufficiently in the future", () => {
                const instance = UserAuthorization.fromPayload(SAMPLE_PAYLOAD);
                const result = instance.isUsable(undefined, Date.now() + DAY_IN_MILISECONDS * 10);

                expect(result).toBe(false);
            });

            test("Throws if `now` is a type other than a number", () => {
                const instance = UserAuthorization.fromPayload(SAMPLE_PAYLOAD);

                expect(() =>
                    instance.isUsable(
                        undefined,
                        // @ts-expect-error Providing wrong type on purpose
                        "10000",
                    ),
                ).toThrowErrorMatchingInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`now\` argument (1 issue):
                   • Expected number, received string]
                `);
            });

            test("Throws if `now` is `NaN`", () => {
                const instance = UserAuthorization.fromPayload(SAMPLE_PAYLOAD);

                expect(() => instance.isUsable(undefined, NaN)).toThrowErrorMatchingInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`now\` argument (1 issue):
                   • Expected number, received nan]
                `);
            });

            test("Throws if `now` is a negative number", () => {
                const instance = UserAuthorization.fromPayload(SAMPLE_PAYLOAD);

                expect(() => instance.isUsable(undefined, -10000)).toThrowErrorMatchingInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`now\` argument (1 issue):
                   • Number must be greater than or equal to 0]
                `);
            });
        });
    });

    describe(".isRefreshable()", () => {
        test("Returns `true` when access token expires in the future", () => {
            const instance = UserAuthorization.fromPayload(SAMPLE_PAYLOAD);
            const result = instance.isRefreshable();

            expect(result).toBe(true);
        });

        test("Returns `false` when access token expires in the past", () => {
            const instance = UserAuthorization.fromPayload(SAMPLE_PAYLOAD_EXPIRED);
            const result = instance.isRefreshable();

            expect(result).toBe(false);
        });

        describe("`tolerance` argument", () => {
            test("Returns `false` if tolerance makes the access token expiry in the past", () => {
                const instance = UserAuthorization.fromPayload(SAMPLE_PAYLOAD);
                const result = instance.isRefreshable(DAY_IN_MILISECONDS * 10);

                expect(result).toBe(false);
            });

            test("Returns `true` if tolerance is 0", () => {
                const instance = UserAuthorization.fromPayload(SAMPLE_PAYLOAD);
                const result = instance.isRefreshable(0);

                expect(result).toBe(true);
            });

            test("Throws if `tolerance` is a type other than a number", () => {
                const instance = UserAuthorization.fromPayload(SAMPLE_PAYLOAD);

                expect(() =>
                    instance.isRefreshable(
                        // @ts-expect-error Providing wrong type on purpose
                        "10000",
                    ),
                ).toThrowErrorMatchingInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`tolerance\` argument (1 issue):
                   • Expected number, received string]
                `);
            });

            test("Throws if `tolerance` is `NaN`", () => {
                const instance = UserAuthorization.fromPayload(SAMPLE_PAYLOAD);

                expect(() => instance.isRefreshable(NaN)).toThrowErrorMatchingInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`tolerance\` argument (1 issue):
                   • Expected number, received nan]
                `);
            });

            test("Throws if `tolerance` is a negative number", () => {
                const instance = UserAuthorization.fromPayload(SAMPLE_PAYLOAD);

                expect(() => instance.isRefreshable(-10000)).toThrowErrorMatchingInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`tolerance\` argument (1 issue):
                   • Number must be greater than or equal to 0]
                `);
            });
        });

        describe("`now` argument", () => {
            test("Returns `false` if `now` is sufficiently in the future", () => {
                const instance = UserAuthorization.fromPayload(SAMPLE_PAYLOAD);
                const result = instance.isRefreshable(undefined, Date.now() + DAY_IN_MILISECONDS * 10);

                expect(result).toBe(false);
            });

            test("Throws if `now` is a type other than a number", () => {
                const instance = UserAuthorization.fromPayload(SAMPLE_PAYLOAD);

                expect(() =>
                    instance.isRefreshable(
                        undefined,
                        // @ts-expect-error Providing wrong type on purpose
                        "10000",
                    ),
                ).toThrowErrorMatchingInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`now\` argument (1 issue):
                   • Expected number, received string]
                `);
            });

            test("Throws if `now` is `NaN`", () => {
                const instance = UserAuthorization.fromPayload(SAMPLE_PAYLOAD);

                expect(() => instance.isRefreshable(undefined, NaN)).toThrowErrorMatchingInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`now\` argument (1 issue):
                   • Expected number, received nan]
                `);
            });

            test("Throws if `now` is a negative number", () => {
                const instance = UserAuthorization.fromPayload(SAMPLE_PAYLOAD);

                expect(() => instance.isRefreshable(undefined, -10000)).toThrowErrorMatchingInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`now\` argument (1 issue):
                   • Number must be greater than or equal to 0]
                `);
            });
        });
    });
});
