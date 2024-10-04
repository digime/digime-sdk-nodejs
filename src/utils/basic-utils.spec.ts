/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import {
    isNonEmptyString,
    addTrailingSlash,
    addLeadingSlash,
    addLeadingAndTrailingSlash,
    areNonEmptyStrings,
    isNumber,
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
