/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { describe, test, expect } from "vitest";
import { getRandomAlphaNumeric, getSha256Hash, fromBase64Url, toBase64Url } from "./crypto";
import nodeCrypto from "node:crypto";

const SAMPLE_MESSAGE = "This is a message";
const SAMPLE_MESSAGE_BASE64URL = "VGhpcyBpcyBhIG1lc3NhZ2U";

describe("crypto", () => {
    describe("getRandomAlphaNumeric", () => {
        test("Creates a string of requested size", () => {
            const randomLength = nodeCrypto.randomInt(10, 100);
            const string = getRandomAlphaNumeric(randomLength);
            expect(string.length).toBe(randomLength);
        });

        test("Creates a string that that should be alphanumeric", () => {
            const randomLength = nodeCrypto.randomInt(10, 100);
            const string = getRandomAlphaNumeric(randomLength);

            expect(/^[\dA-Za-z]*$/.test(string)).toBe(true);
        });

        test("Throws a TypeError if provided a size lower than 0", () => {
            const assertion = () => getRandomAlphaNumeric(nodeCrypto.randomInt(-1000, 0));

            expect(assertion).toThrow(TypeError);
            expect(assertion).toThrowErrorMatchingInlineSnapshot(`[TypeError: Size parameter must be greater than 0]`);
        });

        test("Collision test, 10000 iterations at size 32", () => {
            const randomStrings = new Set();
            const maxIterations = 10000;

            for (let i = 0; i < maxIterations; i++) {
                randomStrings.add(getRandomAlphaNumeric(32));
            }

            expect(randomStrings.size).toBe(maxIterations);
        });
    });

    describe("getSha256Hash", () => {
        test("Creates expected hash", () => {
            const hash = getSha256Hash(SAMPLE_MESSAGE).toString("base64url");
            expect(hash).toBe("qCbH44nsnzecr9xUTX6aQ5X_e_tYkXu-vuUbPQscmWo");
        });
    });

    describe("toBase64Url", () => {
        test("Creates expected string", () => {
            const encoded = toBase64Url(SAMPLE_MESSAGE);
            expect(encoded).toBe(SAMPLE_MESSAGE_BASE64URL);
        });
    });

    describe("fromBase64Url", () => {
        test("Creates expected string", () => {
            const decoded = fromBase64Url(SAMPLE_MESSAGE_BASE64URL);
            expect(decoded).toBe(SAMPLE_MESSAGE);
        });
    });
});
