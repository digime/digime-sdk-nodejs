/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import nodeCrypto from "node:crypto";

const ALPHA_LOWER = "abcdefghijklmnopqrstuvwxyz";
const ALPHA_UPPER = ALPHA_LOWER.toUpperCase();
const NUMERIC = "0123456789";
const ALPHA_NUMERIC = `${ALPHA_LOWER}${ALPHA_UPPER}${NUMERIC}`;

/**
 * Get a string of random alphanumeric characters of a desired size
 */
export const getRandomAlphaNumeric = (size: number): string => {
    // Empty strings are not random
    if (size <= 0) {
        throw new TypeError("Size parameter must be greater than 0");
    }

    let string = "";
    for (let i = 0; i < size; i++) {
        // Pick a random character from ALPHA_NUMERIC
        // Using the ! postfix, as we're generating random ints that fall in the range of ALPHA_NUMERIC
        string += ALPHA_NUMERIC.at(nodeCrypto.randomInt(ALPHA_NUMERIC.length))!;
    }
    return string;
};

/**
 * Get a sha256 digest of a string or a Buffer
 */
export const getSha256Hash = (data: string | Buffer): Buffer => nodeCrypto.createHash("sha256").update(data).digest();

/**
 * Encode to base64url string
 */
export const toBase64Url = (data: string | Buffer): string => {
    if (Buffer.isBuffer(data)) {
        return data.toString("base64url");
    }

    return Buffer.from(data, "utf-8").toString("base64url");
};

/**
 * Decode from base64url to a UTF-8 string
 */
export const fromBase64Url = (data: string | Buffer): string => {
    if (Buffer.isBuffer(data)) {
        return data.toString("utf-8");
    }

    return Buffer.from(data, "base64url").toString("utf-8");
};
