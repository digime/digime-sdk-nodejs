/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { describe, test, expect } from "vitest";
import { AuthorizationCredentials } from "./authorization-credentials";
import { DigiMeSdkError } from "./errors/errors";
import { LegacyOauthTokenPayload, OauthTokenPayload } from "./types/external/oauth-token";

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
} as const satisfies OauthTokenPayload;

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
} as const satisfies LegacyOauthTokenPayload;

describe("AuthorizationCredentials", () => {
    test("Can't directly instantiate", () => {
        const testFunction = () => {
            // @ts-expect-error Providing no parameters to the constructor on purpose
            new AuthorizationCredentials();
        };

        expect(testFunction).toThrowError(DigiMeSdkError);
        expect(testFunction).toThrowErrorMatchingInlineSnapshot(`
          [DigiMeSdkError: \`AuthorizationCredentials\` class should not me instantiated manually. Instead, use one of these static methods to get an instance:
           - AuthorizationCredentials.fromJwt()
           - AuthorizationCredentials.fromPayload()
           - AuthorizationCredentials.fromJsonPayload()
          ]
        `);
    });

    describe("Instantiate from", () => {
        test.todo("JWT", async () => {
            // const promise = AuthorizationCredentials.fromJwt("");
        });

        test("Payload", () => {
            const instance = AuthorizationCredentials.fromPayload(SAMPLE_PAYLOAD);

            expect(instance).toBeInstanceOf(AuthorizationCredentials);
            expect(instance.asPayload()).toMatchObject(SAMPLE_PAYLOAD);
        });

        test("JSON Payload", () => {
            const instance = AuthorizationCredentials.fromJsonPayload(JSON.stringify(SAMPLE_PAYLOAD));

            expect(instance).toBeInstanceOf(AuthorizationCredentials);
            expect(instance.asPayload()).toMatchObject(SAMPLE_PAYLOAD);
        });

        test("Legacy Payload", () => {
            const instance = AuthorizationCredentials.fromLegacyPayload(SAMPLE_LEGACY_PAYLOAD);

            expect(instance).toBeInstanceOf(AuthorizationCredentials);
            expect(instance.asPayload()).toMatchObject(SAMPLE_PAYLOAD);
        });

        test("Legacy JSON Payload", () => {
            const instance = AuthorizationCredentials.fromLegacyJsonPayload(JSON.stringify(SAMPLE_LEGACY_PAYLOAD));

            expect(instance).toBeInstanceOf(AuthorizationCredentials);
            expect(instance.asPayload()).toMatchObject(SAMPLE_PAYLOAD);
        });
    });

    describe("Can get as", () => {
        test.todo("JWT", () => {
            // const instance = AuthorizationCredentials.fromPayload(testPayload);
            // expect(instance.asJwt())
        });

        test("Payload", () => {
            const instance = AuthorizationCredentials.fromPayload(SAMPLE_PAYLOAD);
            expect(instance.asPayload()).toMatchObject(SAMPLE_PAYLOAD);
        });

        test("JSON Payload", () => {
            const instance = AuthorizationCredentials.fromPayload(SAMPLE_PAYLOAD);
            expect(instance.asJsonPayload()).toMatchInlineSnapshot(
                `"{"access_token":{"value":"test-access-token","expires_on":1},"refresh_token":{"value":"test-refresh-token","expires_on":2},"sub":"test-sub"}"`,
            );
        });

        test("Legacy Payload", () => {
            const instance = AuthorizationCredentials.fromPayload(SAMPLE_PAYLOAD);
            expect(instance.asLegacyPayload()).toMatchObject(SAMPLE_LEGACY_PAYLOAD);
        });

        test("Legacy JSON Payload", () => {
            const instance = AuthorizationCredentials.fromPayload(SAMPLE_PAYLOAD);
            expect(instance.asLegacyJsonPayload()).toMatchInlineSnapshot(
                `"{"accessToken":{"expiry":1,"value":"test-access-token"},"refreshToken":{"expiry":2,"value":"test-refresh-token"},"user":{"id":"test-sub"}}"`,
            );
        });
    });
});
