/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { isSDKConfiguration, assertIsSDKConfiguration } from "./sdk-configuration";
import { TypeValidationError } from "../errors";

const actualError = () => assertIsSDKConfiguration({}, "Test error message");
const actualTypeError = () => assertIsSDKConfiguration({ error: {} }, "Test start %s test end");

describe("isSDKConfiguration", () => {
    it("Returns true when given a minimal valid DMESDKConfiguration", () => {
        const config = {
            applicationId: "test-application-id",
        };

        expect(isSDKConfiguration(config)).toBe(true);
    });

    it("Returns false when not passed in required paramters", () => {
        const config = {
            baseUrl: "https://api.digi.me",
        };

        expect(isSDKConfiguration(config)).toBe(false);
    });

    it("Returns true when given a valid DMESDKConfiguration with retryOptions", () => {
        const config = {
            applicationId: "test-application-id",
            baseUrl: "https://api.digi.me",
            retryOptions: {},
        };

        expect(isSDKConfiguration(config)).toBe(true);
    });

    describe("Returns false when given a non-object", () => {
        it.each([true, false, null, undefined, [], 0, Number.NaN, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = isSDKConfiguration(value);
            expect(actual).toBe(false);
        });
    });

    it("Returns false when given an empty object", () => {
        expect(isSDKConfiguration({})).toBe(false);
    });

    describe("Returns false when the baseUrl property is not a string", () => {
        it.each([true, false, null, undefined, [], 0, Number.NaN, {}, () => null, Symbol("test")])("%p", (value) => {
            const actual = isSDKConfiguration({
                baseUrl: value,
            });
            expect(actual).toBe(false);
        });
    });
});

describe("assertIsSDKConfiguration", () => {
    it("Does not throw when given a minimal valid DMESDKConfiguration", () => {
        const config = {
            applicationId: "test-application-id",
        };

        expect(() => assertIsSDKConfiguration(config)).not.toThrow();
    });

    it("Does not throw when given a valid DMESDKConfiguration with retryOptions", () => {
        const config = {
            applicationId: "test-application-id",
            retryOptions: {},
        };

        expect(() => assertIsSDKConfiguration(config)).not.toThrow();
    });

    describe("Throws TypeValidationError when given a non-object", () => {
        it.each([true, false, null, undefined, [], 0, Number.NaN, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = () => assertIsSDKConfiguration(value);
            expect(actual).toThrow(TypeValidationError);
        });
    });

    it("Throws TypeValidationError when given an empty object", () => {
        expect(() => assertIsSDKConfiguration({})).toThrow(TypeValidationError);
    });

    describe("Throws TypeValidationError when the baseUrl property is not a string", () => {
        it.each([true, false, null, undefined, [], 0, Number.NaN, {}, () => null, Symbol("test")])("%p", (value) => {
            const actual = () =>
                assertIsSDKConfiguration({
                    baseUrl: value,
                });
            expect(actual).toThrow(TypeValidationError);
        });
    });

    it("Throws TypeValidationError with custom error messages", () => {
        expect(actualError).toThrow(TypeValidationError);
        expect(actualError).toThrow("Test error message");
    });

    it("Throws TypeValidationError with custom formated error messages", () => {
        expect(actualTypeError).toThrow(TypeValidationError);
        expect(actualTypeError).toThrow(/^Test start ([\S\s]*)? test end$/);
    });
});
