/*!
 * © World Data Exchange. All rights reserved.
 */

import { isCAAccount, assertIsCAAccount } from "./ca-account";
import { TypeValidationError } from "../../errors";

describe("isCAAccount", () => {
    it("Returns true when given an object", () => {
        expect(isCAAccount({})).toBe(true);
    });

    describe("Returns false when given a non-object", () => {
        it.each([true, false, null, undefined, [], 0, Number.NaN, "", () => null, Symbol("test")])("%p", (value) => {
            expect(isCAAccount(value)).toBe(false);
        });
    });
});

const actualErrorMsg = () => assertIsCAAccount(0, "Test error message");
const actualErrorStartEnd = () => assertIsCAAccount(0, "Test start %s test end");

describe("assertIsCAAccount", () => {
    it("Does not throw when given an object", () => {
        expect(() => assertIsCAAccount({})).not.toThrow();
    });

    describe("Throws TypeValidationError when given a non-object", () => {
        it.each([true, false, null, undefined, [], 0, Number.NaN, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = () => assertIsCAAccount(value);
            expect(actual).toThrow(TypeValidationError);
        });
    });

    it("Throws TypeValidationError with custom error messages", () => {
        expect(actualErrorMsg).toThrow(TypeValidationError);
        expect(actualErrorMsg).toThrow("Test error message");
    });

    it("Throws TypeValidationError with custom formated error messages", () => {
        expect(actualErrorStartEnd).toThrow(TypeValidationError);
        expect(actualErrorStartEnd).toThrow(/^Test start ([\S\s]*)? test end$/);
    });
});
