/*!
 * Copyright (c) 2009-2020 digi.me Limited. All rights reserved.
 */

import { isCAAccountsResponse, assertIsCAAccountsResponse } from "./ca-accounts-response";
import { TypeValidationError } from "../../errors";

describe("isCAAccountsResponse", () => {

    it("Returns true when given a valid CAAccountsResponse", async () => {
        expect(isCAAccountsResponse({
            accounts: [],
        })).toBe(true);
    });

    it("Returns false when given an empty object", async () => {
        expect(isCAAccountsResponse({})).toBe(false);
    });

    describe("Returns false when given a non-object", () => {
        it.each([true, false, null, undefined, [], 0, NaN, "", () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                expect(isCAAccountsResponse(value)).toBe(false);
            },
        );
    });

    describe("Returns false when the accounts property is not an array", () => {
        it.each([true, false, null, undefined, {}, 0, NaN, "", () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                expect(isCAAccountsResponse({ accounts: value })).toBe(false);
            },
        );
    });

    describe("Returns false when the accounts property is an array containing non-objects", () => {
        it.each([true, false, null, undefined, [], 0, NaN, "", () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                expect(isCAAccountsResponse({ accounts: [value] })).toBe(false);
            },
        );
    });

});

describe("assertIsCAAccountsResponse", () => {

    it("Does not throw when given a valid CAAccountsResponse", async () => {
        expect(() => assertIsCAAccountsResponse({ accounts: [] })).not.toThrow();
    });

    it("Throws TypeValidationError when given an empty object", async () => {
        expect(() => assertIsCAAccountsResponse({})).toThrow(TypeValidationError);
    });

    describe("Throws TypeValidationError when given a non-object", () => {
        it.each([true, false, null, undefined, [], 0, NaN, "", () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                const actual = () => assertIsCAAccountsResponse(value);
                expect(actual).toThrow(TypeValidationError);
            },
        );
    });

    describe("Throws TypeValidationError when the accounts property is not an array", () => {
        it.each([true, false, null, undefined, {}, 0, NaN, "", () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                const actual = () => assertIsCAAccountsResponse({ accounts: value });
                expect(actual).toThrow(TypeValidationError);
            },
        );
    });

    describe("Throws TypeValidationError when the accounts property is an array containing non-objects", () => {
        it.each([true, false, null, undefined, [], 0, NaN, "", () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                const actual = () => assertIsCAAccountsResponse({ accounts: [value] });
                expect(actual).toThrow(TypeValidationError);
            },
        );
    });

    it("Throws TypeValidationError with custom error messages", () => {
        const actual = () => assertIsCAAccountsResponse(0, "Test error message");
        expect(actual).toThrow(TypeValidationError);
        expect(actual).toThrow("Test error message");
    });

    it("Throws TypeValidationError with custom formated error messages", () => {
        const actual = () => assertIsCAAccountsResponse(0, "Test start %s test end");
        expect(actual).toThrow(TypeValidationError);
        expect(actual).toThrow(/^Test start ([\s\S]*)? test end$/);
    });

});
