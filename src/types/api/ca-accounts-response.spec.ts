/*!
 * © World Data Exchange. All rights reserved.
 */

import { isCAAccountsResponse, assertIsCAAccountsResponse } from "./ca-accounts-response";
import { TypeValidationError } from "../../errors";

const actualError = () => assertIsCAAccountsResponse({}, "Test error message");
const actualTypeError = () => assertIsCAAccountsResponse({ error: {} }, "Test start %s test end");

describe("isCAAccountsResponse", () => {
    it("Returns true when given a valid CAAccountsResponse", () => {
        expect(
            isCAAccountsResponse({
                accounts: [],
            })
        ).toBe(true);
    });

    it("Returns false when given an empty object", () => {
        expect(isCAAccountsResponse({})).toBe(false);
    });

    describe("Returns false when given a non-object", () => {
        it.each([true, false, null, undefined, [], 0, Number.NaN, "", () => null, Symbol("test")])("%p", (value) => {
            expect(isCAAccountsResponse(value)).toBe(false);
        });
    });

    describe("Returns false when the accounts property is not an array", () => {
        it.each([true, false, null, undefined, {}, 0, Number.NaN, "", () => null, Symbol("test")])("%p", (value) => {
            expect(isCAAccountsResponse({ accounts: value })).toBe(false);
        });
    });

    describe("Returns false when the accounts property is an array containing non-objects", () => {
        it.each([true, false, null, undefined, [], 0, Number.NaN, "", () => null, Symbol("test")])("%p", (value) => {
            expect(isCAAccountsResponse({ accounts: [value] })).toBe(false);
        });
    });
});

describe("assertIsCAAccountsResponse", () => {
    it("Does not throw when given a valid CAAccountsResponse", () => {
        expect(() => assertIsCAAccountsResponse({ accounts: [] })).not.toThrow();
    });

    it("Throws TypeValidationError when given an empty object", () => {
        expect(() => assertIsCAAccountsResponse({})).toThrow(TypeValidationError);
    });

    describe("Throws TypeValidationError when given a non-object", () => {
        it.each([true, false, null, undefined, [], 0, Number.NaN, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = () => assertIsCAAccountsResponse(value);
            expect(actual).toThrow(TypeValidationError);
        });
    });

    describe("Throws TypeValidationError when the accounts property is not an array", () => {
        it.each([true, false, null, undefined, {}, 0, Number.NaN, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = () => assertIsCAAccountsResponse({ accounts: value });
            expect(actual).toThrow(TypeValidationError);
        });
    });

    describe("Throws TypeValidationError when the accounts property is an array containing non-objects", () => {
        it.each([true, false, null, undefined, [], 0, Number.NaN, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = () => assertIsCAAccountsResponse({ accounts: [value] });
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
