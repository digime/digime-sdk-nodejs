/*!
 * Copyright (c) 2009-2022 digi.me Limited. All rights reserved.
 */

import { TypeValidationError } from "../errors";
import { isRetryOptions, assertIsRetryOptions } from "./retry-options";

const VALID_HTTP_METHODS = [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "HEAD",
    "DELETE",
    "OPTIONS",
    "TRACE",
    "get",
    "post",
    "put",
    "patch",
    "head",
    "delete",
    "options",
    "trace",
];

describe("isRetryOptions", () => {
    it("Returns true when given all RetryOptions properties", async () => {
        const config = {
            retries: 2,
            limit: 4,
            methods: ["GET"],
            statusCodes: [200],
            errorCodes: ["ETIMEDOUT"],
            calculateDelay: jest.fn(),
            maxRetryAfter: 5,
        };

        expect(isRetryOptions(config)).toBe(true);
    });

    it("Returns true when given an empty object", () => {
        expect(isRetryOptions({})).toBe(true);
    });

    describe("Returns true when the methods property is an array with a valid HTTP method", () => {
        it.each(VALID_HTTP_METHODS)("%p", (value) => {
            const actual = isRetryOptions({
                methods: [value],
            });
            expect(actual).toBe(true);
        });
    });

    it("Returns true when the methods property is an array with multiple valid HTTP methods", () => {
        expect(
            isRetryOptions({
                methods: VALID_HTTP_METHODS,
            })
        ).toBe(true);
    });

    describe("Returns false when given a non-object", () => {
        it.each([true, false, null, undefined, [], 0, NaN, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = isRetryOptions(value);
            expect(actual).toBe(false);
        });
    });

    describe("Returns false when the retries property of the retryOptions object is not a number", () => {
        it.each([true, false, null, [], "", {}, () => null, Symbol("test")])("%p", (value) => {
            const actual = isRetryOptions({
                retries: value,
            });
            expect(actual).toBe(false);
        });
    });

    describe("Returns false when the limit property of the retryOptions object is not a number", () => {
        it.each([true, false, null, [], {}, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = isRetryOptions({
                limit: value,
            });
            expect(actual).toBe(false);
        });
    });

    describe("Returns false when the methods property of the retryOptions object is not an array of strings", () => {
        it.each([true, false, null, {}, 0, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = isRetryOptions({
                methods: value,
            });
            expect(actual).toBe(false);
        });
    });

    describe("Returns false when the methods property of the retryOptions object is an array of invalid strings", () => {
        it.each([[["test"]], [["TEST"]], [["TEST", "test"]]])("%p", (value) => {
            const actual = isRetryOptions({
                methods: value,
            });
            expect(actual).toBe(false);
        });
    });

    describe("Returns false when the statusCodes property of the retryOptions object is not an array of numbers", () => {
        it.each([true, false, null, {}, 0, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = isRetryOptions({
                statusCodes: value,
            });
            expect(actual).toBe(false);
        });
    });

    describe("Returns false when the errorCodes property of the retryOptions object is not an array of strings", () => {
        it.each([true, false, null, {}, 0, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = isRetryOptions({
                errorCodes: value,
            });
            expect(actual).toBe(false);
        });
    });

    describe("Returns false when the calculateDelay property of the retryOptions object is not a function", () => {
        it.each([true, false, null, {}, 0, "", [], Symbol("test")])("%p", (value) => {
            const actual = isRetryOptions({
                calculateDelay: value,
            });
            expect(actual).toBe(false);
        });
    });

    describe("Returns false when the maxRetryAfter property of the retryOptions object is not a number", () => {
        it.each([true, false, null, [], "", {}, () => null, Symbol("test")])("%p", (value) => {
            const actual = isRetryOptions({
                maxRetryAfter: value,
            });
            expect(actual).toBe(false);
        });
    });
});

describe("assertIsRetryOptions", () => {
    it("Does not throw when given all RetryOptions properties", async () => {
        const config = {
            retries: 2,
            limit: 4,
            methods: ["GET"],
            statusCodes: [200],
            errorCodes: ["ETIMEDOUT"],
            calculateDelay: jest.fn(),
            maxRetryAfter: 5,
        };

        expect(() => assertIsRetryOptions(config)).not.toThrow();
    });

    it("Does not throw when given an empty object", () => {
        expect(() => assertIsRetryOptions({})).not.toThrow();
    });

    describe("Does not throw when the methods property is an array with a valid HTTP method", () => {
        it.each(VALID_HTTP_METHODS)("%p", (value) => {
            expect(() => assertIsRetryOptions({ methods: [value] })).not.toThrow();
        });
    });

    it("Does not throw when the methods property is an array with multiple valid HTTP methods", () => {
        expect(() => assertIsRetryOptions({ methods: VALID_HTTP_METHODS })).not.toThrow();
    });

    describe("Throws TypeValidationError when given a non-object", () => {
        it.each([true, false, null, undefined, [], 0, NaN, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = () => assertIsRetryOptions(value);
            expect(actual).toThrow(TypeValidationError);
        });
    });

    describe("Throws TypeValidationError when the retries property of the retryOptions object is not a number", () => {
        it.each([true, false, null, [], {}, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = () =>
                assertIsRetryOptions({
                    retries: value,
                });
            expect(actual).toThrow(TypeValidationError);
        });
    });

    describe("Throws TypeValidationError when the limit property of the retryOptions object is not a number", () => {
        it.each([true, false, null, [], {}, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = () =>
                assertIsRetryOptions({
                    limit: value,
                });
            expect(actual).toThrow(TypeValidationError);
        });
    });

    describe("Throws TypeValidationError when the methods property of the retryOptions object is not an array of strings", () => {
        it.each([true, false, null, {}, 0, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = () =>
                assertIsRetryOptions({
                    methods: value,
                });
            expect(actual).toThrow(TypeValidationError);
        });
    });

    describe("Throws TypeValidationError when the methods property of the retryOptions object is an array of invalid strings", () => {
        it.each([[["test"]], [["TEST"]], [["TEST", "test"]]])("%p", (value) => {
            const actual = () =>
                assertIsRetryOptions({
                    methods: value,
                });
            expect(actual).toThrow(TypeValidationError);
        });
    });

    describe("Throws TypeValidationError when the statusCodes property of the retryOptions object is not an array of numbers", () => {
        it.each([true, false, null, {}, 0, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = () =>
                assertIsRetryOptions({
                    statusCodes: value,
                });
            expect(actual).toThrow(TypeValidationError);
        });
    });

    describe("Throws TypeValidationError when the errorCodes property of the retryOptions object is not an array of strings", () => {
        it.each([true, false, null, {}, 0, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = () =>
                assertIsRetryOptions({
                    errorCodes: value,
                });
            expect(actual).toThrow(TypeValidationError);
        });
    });

    describe("Throws TypeValidationError when the calculateDelay property of the retryOptions object is not a function", () => {
        it.each([true, false, null, {}, 0, "", [], Symbol("test")])("%p", (value) => {
            const actual = () =>
                assertIsRetryOptions({
                    calculateDelay: value,
                });
            expect(actual).toThrow(TypeValidationError);
        });
    });

    describe("Throws TypeValidationError when the maxRetryAfter property of the retryOptions object is not a number", () => {
        it.each([true, false, null, [], {}, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = () =>
                assertIsRetryOptions({
                    maxRetryAfter: value,
                });
            expect(actual).toThrow(TypeValidationError);
        });
    });

    it("Throws TypeValidationError with custom error messages", () => {
        const actual = () => assertIsRetryOptions(0, "Test error message");
        expect(actual).toThrow(TypeValidationError);
        expect(actual).toThrow("Test error message");
    });

    it("Throws TypeValidationError with custom formated error messages", () => {
        const actual = () => assertIsRetryOptions(0, "Test start %s test end");
        expect(actual).toThrow(TypeValidationError);
        expect(actual).toThrow(/^Test start ([\S\s]*)? test end$/);
    });
});
