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
 *
 * NOTE: Duplicated from Digi.me internal crypto lib
 */
export const getRandomAlphaNumeric = (size: number): string => {
    const charsLength = ALPHA_NUMERIC.length;
    const value: string[] = Array.from({ length: size });

    for (let i = 0; i < size; i++) {
        let random: number;

        do {
            random = nodeCrypto.randomBytes(1).readUInt8(0);
        } while (random > 256 - (256 % charsLength));

        value[i] = ALPHA_NUMERIC[random % charsLength]!;
    }

    return value.join("");
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
