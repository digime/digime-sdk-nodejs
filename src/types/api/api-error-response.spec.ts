/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import { isApiErrorResponse, assertIsApiErrorResponse } from "./api-error-response";
import { TypeValidationError } from "../..";

describe("isApiErrorResponse", () => {
    it("Returns true when given a valid API error response", async () => {
        const fixtures = [
            ...(
                await import("../../../fixtures/network/get-session-accounts/invalid-sdk-version.json")
            ).default.values(),
            ...(await import("../../../fixtures/network/get-session-accounts/invalid-sdk.json")).default.values(),
            ...(await import("../../../fixtures/network/get-session-accounts/bad-request.json")).default.values(),
        ];

        expect.assertions(fixtures.length);

        for (const fixture of fixtures) {
            expect(isApiErrorResponse(fixture.response)).toBe(true);
        }
    });

    describe("Returns false when given a non-object", () => {
        it.each([true, false, null, undefined, [], 0, NaN, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = isApiErrorResponse(value);
            expect(actual).toBe(false);
        });
    });

    it("Returns false when given an empty object", () => {
        expect(isApiErrorResponse({})).toBe(false);
    });

    describe("Returns false when the code property of the error object is not a string", () => {
        it.each([true, false, null, undefined, [], 0, NaN, {}, () => null, Symbol("test")])("%p", (value) => {
            const actual = isApiErrorResponse({
                error: {
                    code: value,
                    message: "Test message",
                },
            });
            expect(actual).toBe(false);
        });
    });

    describe("Returns false when the message property of the error object is not a string", () => {
        it.each([true, false, null, undefined, [], 0, NaN, {}, () => null, Symbol("test")])("%p", (value) => {
            const actual = isApiErrorResponse({
                error: {
                    code: "Test code",
                    message: value,
                },
            });
            expect(actual).toBe(false);
        });
    });

    it("Returns false when error object is missing the code property", async () => {
        const response = {
            error: {
                message: "Test message",
            },
        };

        expect(isApiErrorResponse(response)).toBe(false);
    });

    it("Returns false when error object is missing the message property", async () => {
        const response = {
            error: {
                code: "SDKInvalid",
            },
        };

        expect(isApiErrorResponse(response)).toBe(false);
    });
});

describe("assertIsApiErrorResponse", () => {
    it("Does not throw when given a valid SDKVersionInvalidError error object", async () => {
        const fixtures = [
            ...(
                await import("../../../fixtures/network/get-session-accounts/invalid-sdk-version.json")
            ).default.values(),
            ...(await import("../../../fixtures/network/get-session-accounts/invalid-sdk.json")).default.values(),
            ...(await import("../../../fixtures/network/get-session-accounts/bad-request.json")).default.values(),
        ];

        expect.assertions(fixtures.length);

        for (const fixture of fixtures) {
            expect(() => assertIsApiErrorResponse(fixture.response)).not.toThrow();
        }
    });

    describe("Throws TypeValidationError when given a non-object", () => {
        it.each([true, false, null, undefined, [], 0, NaN, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = () => assertIsApiErrorResponse(value);
            expect(actual).toThrow(TypeValidationError);
        });
    });

    it("Throws TypeValidationError when given an empty object", () => {
        expect(() => assertIsApiErrorResponse({})).toThrow(TypeValidationError);
    });

    describe("Throws TypeValidationError when the message property of the error object is not a string", () => {
        it.each([true, false, null, undefined, [], 0, NaN, "", {}, () => null, Symbol("test")])("%p", (value) => {
            const actual = () =>
                assertIsApiErrorResponse({
                    error: value,
                });
            expect(actual).toThrow(TypeValidationError);
        });
    });

    describe("Throws TypeValidationError when the code property of the error object is not a string", () => {
        it.each([true, false, null, undefined, [], 0, NaN, {}, () => null, Symbol("test")])("%p", (value) => {
            const actual = () =>
                assertIsApiErrorResponse({
                    error: {
                        code: value,
                        message: "Test message",
                    },
                });
            expect(actual).toThrow(TypeValidationError);
        });
    });

    describe("Throws TypeValidationError when the message property of the error object is not a string", () => {
        it.each([true, false, null, undefined, [], 0, NaN, {}, () => null, Symbol("test")])("%p", (value) => {
            const actual = () =>
                assertIsApiErrorResponse({
                    error: {
                        code: "Test code",
                        message: value,
                    },
                });
            expect(actual).toThrow(TypeValidationError);
        });
    });

    it("Throws TypeValidationError with custom error messages", () => {
        const actual = () => assertIsApiErrorResponse({}, "Test error message");
        expect(actual).toThrow(TypeValidationError);
        expect(actual).toThrow("Test error message");
    });

    it("Throws TypeValidationError with custom formated error messages", () => {
        const actual = () => assertIsApiErrorResponse({ error: {} }, "Test start %s test end");
        expect(actual).toThrow(TypeValidationError);
        expect(actual).toThrow(/^Test start ([\S\s]*)? test end$/);
    });
});
