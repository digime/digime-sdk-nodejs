/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { isCAAccount, assertIsCAAccount } from "./ca-account";
import { TypeValidationError } from "../../errors";

describe("isCAAccount", () => {
    it("Returns true when given an object", async () => {
        expect(isCAAccount({})).toBe(true);
    });

    describe("Returns false when given a non-object", () => {
        it.each([true, false, null, undefined, [], 0, NaN, "", () => null, Symbol("test")])("%p", (value) => {
            expect(isCAAccount(value)).toBe(false);
        });
    });
});

describe("assertIsCAAccount", () => {
    it("Does not throw when given an object", async () => {
        expect(() => assertIsCAAccount({})).not.toThrow();
    });

    describe("Throws TypeValidationError when given a non-object", () => {
        it.each([true, false, null, undefined, [], 0, NaN, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = () => assertIsCAAccount(value);
            expect(actual).toThrow(TypeValidationError);
        });
    });

    it("Throws TypeValidationError with custom error messages", () => {
        const actual = () => assertIsCAAccount(0, "Test error message");
        expect(actual).toThrow(TypeValidationError);
        expect(actual).toThrow("Test error message");
    });

    it("Throws TypeValidationError with custom formated error messages", () => {
        const actual = () => assertIsCAAccount(0, "Test start %s test end");
        expect(actual).toThrow(TypeValidationError);
        expect(actual).toThrow(/^Test start ([\S\s]*)? test end$/);
    });
});
