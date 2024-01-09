/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { describe, test, expect } from "vitest";
import { AuthorizationCredentials } from "./authorization-credentials";
import { DigiMeSdkError } from "./errors/errors";

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
            const instance = AuthorizationCredentials.fromPayload({
                access_token: {
                    value: "test",
                    expires_on: 1,
                },
                refresh_token: {
                    value: "test",
                    expires_on: 1,
                },
            });

            expect(instance).toBeInstanceOf(AuthorizationCredentials);
        });

        test("JSON Payload", () => {
            const instance = AuthorizationCredentials.fromJsonPayload(
                JSON.stringify({
                    access_token: {
                        value: "test",
                        expires_on: 1,
                    },
                    refresh_token: {
                        value: "test",
                        expires_on: 1,
                    },
                }),
            );

            expect(instance).toBeInstanceOf(AuthorizationCredentials);
        });

        test("Legacy Payload", () => {
            const instance = AuthorizationCredentials.fromLegacyPayload({
                accessToken: {
                    value: "test",
                    expiry: 1,
                },
                refreshToken: {
                    value: "test",
                    expiry: 1,
                },
            });

            expect(instance).toBeInstanceOf(AuthorizationCredentials);
        });

        test("Legacy JSON Payload", () => {
            const instance = AuthorizationCredentials.fromLegacyJsonPayload(
                JSON.stringify({
                    accessToken: {
                        value: "test",
                        expiry: 1,
                    },
                    refreshToken: {
                        value: "test",
                        expiry: 1,
                    },
                }),
            );

            expect(instance).toBeInstanceOf(AuthorizationCredentials);
        });
    });

    describe("Can get as", () => {
        const instance = AuthorizationCredentials.fromPayload({
            access_token: {
                value: "test",
                expires_on: 1,
            },
            refresh_token: {
                value: "test",
                expires_on: 1,
            },
        });

        test.todo("JWT", () => {});

        test("Payload", () => {
            expect(instance.asPayload()).toMatchInlineSnapshot(`
              {
                "access_token": {
                  "expires_on": 1,
                  "value": "test",
                },
                "refresh_token": {
                  "expires_on": 1,
                  "value": "test",
                },
              }
            `);
        });

        test("JSON Payload", () => {
            expect(instance.asJsonPayload()).toMatchInlineSnapshot(
                `"{"access_token":{"value":"test","expires_on":1},"refresh_token":{"value":"test","expires_on":1}}"`,
            );
        });

        test("Legacy Payload", () => {
            expect(instance.asLegacyPayload()).toMatchInlineSnapshot(`
              {
                "accessToken": {
                  "expiry": 1,
                  "value": "test",
                },
                "refreshToken": {
                  "expiry": 1,
                  "value": "test",
                },
              }
            `);
        });

        test("Legacy JSON Payload", () => {
            expect(instance.asLegacyJsonPayload()).toMatchInlineSnapshot(
                `"{"accessToken":{"expiry":1,"value":"test"},"refreshToken":{"expiry":1,"value":"test"}}"`,
            );
        });
    });
});
