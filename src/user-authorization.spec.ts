/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { describe, test, expect } from "vitest";
import { UserAuthorization } from "./user-authorization";
import { DigiMeSdkError } from "./errors/errors";
import { LegacyUserAuthorizationPayload, UserAuthorizationPayload } from "./types/external/oauth-token";
import { mockApiInternals } from "./mocks/api-internals";

const SAMPLE_PAYLOAD = {
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

    describe("Instantiate from", () => {
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
            expect(instance.asJsonPayload()).toMatchInlineSnapshot(
                `"{"access_token":{"value":"test-access-token","expires_on":1},"refresh_token":{"value":"test-refresh-token","expires_on":2},"sub":"test-sub"}"`,
            );
        });

        test("Legacy Payload", () => {
            const instance = UserAuthorization.fromPayload(SAMPLE_PAYLOAD);
            expect(instance.asLegacyPayload()).toMatchObject(SAMPLE_LEGACY_PAYLOAD);
        });

        test("Legacy JSON Payload", () => {
            const instance = UserAuthorization.fromPayload(SAMPLE_PAYLOAD);
            expect(instance.asLegacyJsonPayload()).toMatchInlineSnapshot(
                `"{"accessToken":{"expiry":1,"value":"test-access-token"},"refreshToken":{"expiry":2,"value":"test-refresh-token"},"user":{"id":"test-sub"}}"`,
            );
        });
    });
});
