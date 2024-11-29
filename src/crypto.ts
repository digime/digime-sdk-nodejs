/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import crypto from "node:crypto";
import NodeRSA from "node-rsa";
import { FileDecryptionError } from "./errors";
import stream from "node:stream";
import { CipherTransform } from "./cipher-transform";
import { DecipherTransform } from "./decipher-transform";

const BYTES = {
    DSK: [0, 256],
    DIV: [256, 272],
    DATA: [272],
};

const ALPHA_LOWER = `abcdefghijklmnopqrstuvwxyz`;
const ALPHA_UPPER: string = ALPHA_LOWER.toUpperCase();
const NUMERIC = `0123456789`;
export const ALPHA_NUMERIC = `${ALPHA_LOWER}${ALPHA_UPPER}${NUMERIC}`;

const isValidSize = (data: Buffer): boolean => {
    const bytes = data.length;
    return bytes >= 288 && bytes % 16 === 0;
};

const decryptData = (key: NodeRSA, file: Buffer): Buffer => {
    // Verify file data is of correct length
    if (!isValidSize(file)) {
        throw new FileDecryptionError(`File size not valid: ${String(file.length)}`);
    }

    // Recover DSK and DIV
    const dsk: Buffer = key.decrypt(file.subarray(...BYTES.DSK));
    const div: Buffer = file.subarray(...BYTES.DIV);

    // Recover concated hash and data
    const decipher = crypto.createDecipheriv("aes-256-cbc", dsk, div);
    const data = Buffer.concat([decipher.update(file.subarray(...BYTES.DATA)), decipher.final()]);

    return data;
};

const createEncryptStream = (privateKey: string): stream.Transform => {
    return new CipherTransform(privateKey);
};

const createDecryptStream = (privateKey: string): stream.Transform => {
    return new DecipherTransform(privateKey);
};

const getRandomAlphaNumeric = (size: number): string => {
    // Empty strings are not random
    if (size <= 0) {
        throw new TypeError("Size parameter must be greater than 0");
    }

    let string = "";
    for (let i = 0; i < size; i++) {
        // Pick a random character from ALPHA_NUMERIC
        // Using the ! postfix, as we're generating random ints that fall in the range of ALPHA_NUMERIC
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        string += ALPHA_NUMERIC.at(crypto.randomInt(ALPHA_NUMERIC.length))!;
    }
    return string;
};

const hashSha256 = (data: string | Buffer): Buffer => crypto.createHash("sha256").update(data).digest();

export { decryptData, getRandomAlphaNumeric, hashSha256, createEncryptStream, createDecryptStream, isValidSize };
