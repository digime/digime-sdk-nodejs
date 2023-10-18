/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { describe, test, expect } from "vitest";
import { getSha256Hash, fromBase64Url, toBase64Url } from "./crypto";

const SAMPLE_MESSAGE = "This is a message";
const SAMPLE_MESSAGE_BASE64URL = "VGhpcyBpcyBhIG1lc3NhZ2U";

describe("crypto", () => {
    // describe("getRandomAlphaNumeric", () => {

    // });

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
