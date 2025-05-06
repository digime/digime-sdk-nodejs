/*!
 * © World Data Exchange. All rights reserved.
 */

import {
    isNonEmptyString,
    addTrailingSlash,
    addLeadingSlash,
    addLeadingAndTrailingSlash,
    areNonEmptyStrings,
    isNumber,
    isFunction,
    isString,
    isPlainObject,
} from "./basic-utils";

describe("isNonEmptyString: Returns false when non empty string is passed", () => {
    test.each([true, false, null, undefined, [], 0, Number.NaN, "", () => null, Symbol("test")])(
        "%p",
        (testValue: unknown) => {
            const actual = isNonEmptyString(testValue);

            expect(actual).toBe(false);
        }
    );
});

describe("addTrailingSlash", () => {
    it("should return the URL with a trailing slash if it does not have one", () => {
        expect(addTrailingSlash("http://example.com")).toBe("http://example.com/");
    });

    it("should return the same URL if it already has a trailing slash", () => {
        expect(addTrailingSlash("http://example.com/")).toBe("http://example.com/");
    });

    it("should return undefined for non-string or empty inputs", () => {
        expect(addTrailingSlash(null)).toBeUndefined();
        expect(addTrailingSlash("")).toBeUndefined();
    });
});

describe("addLeadingSlash", () => {
    it("should return the URL with a leading slash if it does not have one", () => {
        expect(addLeadingSlash("example.com")).toBe("/example.com");
    });

    it("should return the same URL if it already has a leading slash", () => {
        expect(addLeadingSlash("/example.com")).toBe("/example.com");
    });

    it("should return undefined for non-string or empty inputs", () => {
        expect(addLeadingSlash(null)).toBeUndefined();
        expect(addLeadingSlash("")).toBeUndefined();
    });
});

describe("addLeadingAndTrailingSlash", () => {
    it("should add both leading and trailing slashes to a URL", () => {
        expect(addLeadingAndTrailingSlash("example.com")).toBe("/example.com/");
    });

    it("should return the same URL if it already has leading and trailing slashes", () => {
        expect(addLeadingAndTrailingSlash("/example.com/")).toBe("/example.com/");
    });

    it('should return "/" for non-string or empty inputs', () => {
        expect(addLeadingAndTrailingSlash(null)).toBe("/");
        expect(addLeadingAndTrailingSlash("")).toBe("/");
    });
});

describe("areNonEmptyStrings", () => {
    it("should return true for an array of non-empty strings", () => {
        expect(areNonEmptyStrings(["hello", "world"])).toBe(true);
    });

    it("should return false if any value in the array is not a non-empty string", () => {
        expect(areNonEmptyStrings(["hello", ""])).toBe(false);
        expect(areNonEmptyStrings([123, "world"])).toBe(false);
    });
});

describe("isNumber", () => {
    it("should return true for numbers", () => {
        expect(isNumber(123)).toBe(true);
    });

    it("should return false for non-number values", () => {
        expect(isNumber("123")).toBe(false);
        expect(isNumber(null)).toBe(false);
    });
});

describe("isFunction", () => {
    it("should return true for a regular function", () => {
        expect(isFunction(() => {})).toBe(true);
    });

    it("should return true for a function with parameters", () => {
        expect(isFunction((a: number, b: number) => a + b)).toBe(true);
    });

    it("should return false for a string", () => {
        expect(isFunction("hello")).toBe(false);
    });

    it("should return false for a number", () => {
        expect(isFunction(123)).toBe(false);
    });

    it("should return false for null", () => {
        expect(isFunction(null)).toBe(false);
    });

    it("should return false for an object", () => {
        expect(isFunction({})).toBe(false);
    });

    it("should return false for an array", () => {
        expect(isFunction([])).toBe(false);
    });
});

describe("isString", () => {
    test.each([
        ["regular string", "hello", true],
        ["empty string", "", true],
        ["string via String constructor", String("test"), true],
        ["number", 42, false],
        ["boolean", true, false],
        ["null", null, false],
        ["undefined", undefined, false],
        ["object", {}, false],
        ["array", [], false],
        ["function", () => {}, false],
    ])("should return %s -> %s", (_desc, input, expected) => {
        expect(isString(input)).toBe(expected);
    });
});

describe("isPlainObject", () => {
    test.each([
        ["empty object literal", {}, true],
        ["object with properties", { a: 1, b: 2 }, true],
        ["object created with Object.create(null)", Object.create(null), true],
        ["array", [], false],
        ["null", null, false],
        ["Date instance", new Date(), false],
        ["function", () => {}, false],
        ["number", 123, false],
        ["string", "test", false],
        ["boolean", true, false],
        ["Map instance", new Map(), false],
        ["Set instance", new Set(), false],
        // eslint-disable-next-line @typescript-eslint/no-extraneous-class
        ["class instance", new (class A {})(), false],
    ])("should return %s -> %s", (_desc, input, expected) => {
        expect(isPlainObject(input)).toBe(expected);
    });
});
