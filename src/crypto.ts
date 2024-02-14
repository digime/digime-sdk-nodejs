/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import nodeCrypto from "node:crypto";
import { DigiMeSdkError } from "./errors/errors";
import { nodeDuplexToWeb } from "./node-streams";
import { concatUint8Array } from "./concat-uint8array";

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

/**
 * Byte grouping of the API file response
 */
const BYTES = {
    key: { from: 0, to: 256 },
    iv: { from: 256, to: 272 },
    data: { from: 272 },
} as const;

/**
 * Creates a API file response decrypt stream
 */
export const getDecryptReadableStream = async (
    key: string,
    inputStream: ReadableStream<Uint8Array>,
): Promise<ReadableStream<Uint8Array>> => {
    let preDataBuffer = new Uint8Array();
    let firstDataChunk = new Uint8Array();

    const reader = inputStream.getReader();

    // Read the non-data bytes until we have key and IV bytes
    while (preDataBuffer.length < BYTES.data.from) {
        const { done, value } = await reader.read();

        if (done) {
            throw new DigiMeSdkError("Stream did not contain enough data");
        }

        const neededBytes = BYTES.data.from - preDataBuffer.length;
        const preDataChunk = value.subarray(0, neededBytes);
        firstDataChunk = value.subarray(neededBytes);
        preDataBuffer = concatUint8Array(preDataBuffer, preDataChunk);
    }
    reader.releaseLock();

    // Create decipheriv transform stream
    const dsk = nodeCrypto.privateDecrypt(
        nodeCrypto.createPrivateKey(key),
        preDataBuffer.subarray(BYTES.key.from, BYTES.key.to),
    );
    const div = preDataBuffer.subarray(BYTES.iv.from, BYTES.iv.to);
    const decipherTransform = nodeCrypto.createDecipheriv("aes-256-cbc", dsk, div);

    // Write the first chunk of data we got
    decipherTransform.write(firstDataChunk);

    // Pipe the rest of the input stream through the deciper transform
    return inputStream.pipeThrough(nodeDuplexToWeb(decipherTransform));
};
