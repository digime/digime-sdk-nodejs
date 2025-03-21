/*!
 * © World Data Exchange. All rights reserved.
 */

import { isJWKS, assertIsJWKS } from "./jwks";
import { TypeValidationError } from "../../errors";

const actualError = () => assertIsJWKS({}, "Test error message");
const actualTypeError = () => assertIsJWKS({ error: {} }, "Test start %s test end");

describe("isJWKS", () => {
    it("Returns true when given a valid JWKS with empty keys", () => {
        const valid = {
            keys: [],
        };

        expect(isJWKS(valid)).toBe(true);
    });

    it("Returns true when given a valid JWKS with some valid keys", () => {
        const valid = {
            keys: [{}, {}],
        };

        expect(isJWKS(valid)).toBe(true);
    });

    describe("Returns false when given a non-object", () => {
        it.each([true, false, null, undefined, [], 0, Number.NaN, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = isJWKS(value);
            expect(actual).toBe(false);
        });
    });

    it("Returns false when given an empty object", () => {
        expect(isJWKS({})).toBe(false);
    });

    describe("Returns false when keys is not an array", () => {
        it.each([true, false, null, undefined, 0, Number.NaN, {}, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = isJWKS({ keys: value });
            expect(actual).toBe(false);
        });
    });

    describe("Returns false when keys array contains non-object entities", () => {
        it.each([true, false, null, undefined, 0, Number.NaN, [], "", () => null, Symbol("test")])("%p", (value) => {
            const actual = isJWKS({ keys: [{}, value] });
            expect(actual).toBe(false);
        });
    });
});

describe("assertIsJWKS", () => {
    it("Does not throw when given a valid JWKS with empty keys", () => {
        const valid = {
            keys: [],
        };

        expect(() => assertIsJWKS(valid)).not.toThrow();
    });

    it("Does not throw when given a valid JWKS with some valid keys", () => {
        const valid = {
            keys: [{}, {}],
        };

        expect(() => assertIsJWKS(valid)).not.toThrow();
    });

    describe("Throws TypeValidationError when given a non-object", () => {
        it.each([true, false, null, undefined, [], 0, Number.NaN, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = () => assertIsJWKS(value);
            expect(actual).toThrow(TypeValidationError);
        });
    });

    it("Throws TypeValidationError when given an empty object", () => {
        expect(() => assertIsJWKS({})).toThrow(TypeValidationError);
    });

    describe("Throws TypeValidationError when keys is not an array", () => {
        it.each([true, false, null, undefined, 0, Number.NaN, {}, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = () => assertIsJWKS({ keys: value });
            expect(actual).toThrow(TypeValidationError);
        });
    });

    describe("Throws TypeValidationError when keys array contains non-object entities", () => {
        it.each([true, false, null, undefined, 0, Number.NaN, [], "", () => null, Symbol("test")])("%p", (value) => {
            const actual = () => assertIsJWKS({ keys: [{}, value] });
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
