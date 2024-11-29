/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { ALPHA_NUMERIC, getRandomAlphaNumeric, isValidSize } from "./crypto";

describe("getRandomAlphaNumeric", () => {
    it("should return a string of the correct length", () => {
        const size = 10;
        const result = getRandomAlphaNumeric(size);
        expect(result).toHaveLength(size);
    });

    it("should only contain characters from ALPHA_NUMERIC", () => {
        const size = 100;
        const result = getRandomAlphaNumeric(size);
        for (const char of result) {
            expect(ALPHA_NUMERIC).toContain(char);
        }
    });

    it("should return different values on consecutive calls", () => {
        const size = 10;
        const result1 = getRandomAlphaNumeric(size);
        const result2 = getRandomAlphaNumeric(size);
        expect(result1).not.toBe(result2);
    });

    it("should handle a large size correctly", () => {
        const size = 1000;
        const result = getRandomAlphaNumeric(size);
        expect(result).toHaveLength(size);
    });
});

describe("isValidSize", () => {
    it("should return true for a buffer size that is divisible by 16 and >= 288", () => {
        const buffer = Buffer.alloc(288);
        expect(isValidSize(buffer)).toBe(true);

        const bufferLarge = Buffer.alloc(304);
        expect(isValidSize(bufferLarge)).toBe(true);
    });

    it("should return false for a buffer size less than 288 bytes", () => {
        const buffer = Buffer.alloc(200);
        expect(isValidSize(buffer)).toBe(false);
    });

    it("should return false for a buffer size not divisible by 16", () => {
        const buffer = Buffer.alloc(290);
        expect(isValidSize(buffer)).toBe(false);
    });

    it("should return false for a size less than 288 and not divisible by 16", () => {
        const buffer = Buffer.alloc(250);
        expect(isValidSize(buffer)).toBe(false);
    });

    it("should return true for exactly 288 bytes (divisible by 16)", () => {
        const buffer = Buffer.alloc(288);
        expect(isValidSize(buffer)).toBe(true);
    });

    it("should return false for exactly 288 bytes but not divisible by 16", () => {
        const buffer = Buffer.alloc(287);
        expect(isValidSize(buffer)).toBe(false);
    });
});
