/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import nodeCrypto from "node:crypto";
import fs from "node:fs";
import { promisify } from "node:util";
import { nodeDuplexToWeb, nodeReadableToWeb } from "../src/node-streams";

const DEFAULT_MOCK_API_BASE_URL = "https://api.digi.me/v1.7/";

export const fromMockApiBase = (path: string, base: string = DEFAULT_MOCK_API_BASE_URL): string =>
    new URL(path, base).toString();

export const formatBodyError = ({
    code,
    message,
    reference = "--MOCKED ERROR--",
}: {
    code: string;
    message: string;
    reference?: string | undefined;
}) => ({
    error: {
        code,
        message,
        reference,
    },
});

export const formatHeadersError = ({
    code,
    message,
    reference = "--MOCKED ERROR--",
}: {
    code: string;
    message: string;
    reference?: string | undefined;
}) => ({
    "X-Error-Code": code,
    "X-Error-Message": message,
    "X-Error-Reference": reference,
});

export const getTestUrl = (...parts: string[]): string =>
    `https://${[...parts, nodeCrypto.randomUUID()].join(".")}.test/`;

export const createReadableStream = (...args: Parameters<typeof fs.createReadStream>) => {
    return nodeReadableToWeb(fs.createReadStream(...args));
};

export const generateKeyPair = async () => await promisify(nodeCrypto.generateKeyPair)("rsa", { modulusLength: 2048 });

export const keyAsPkcs1PemString = (key: nodeCrypto.KeyObject): string => {
    const exportedKey = key.export({ type: "pkcs1", format: "pem" });

    if (typeof exportedKey === "string") return exportedKey;

    return exportedKey.toString("utf-8");
};

export const createFileEncryptTransformStream = (publicKey: nodeCrypto.KeyObject) => {
    const key = nodeCrypto.randomBytes(32);
    const encryptedKey = nodeCrypto.publicEncrypt(publicKey, key);
    const iv = nodeCrypto.randomBytes(16);
    const cipherivTransform = nodeDuplexToWeb(nodeCrypto.createCipheriv("aes-256-cbc", key, iv));

    return {
        cipherivTransform,
        encryptedKey,
        iv,
    };
};

export const createFileEncryptPipeline = (
    publicKey: nodeCrypto.KeyObject,
    ...createReadableStreamArgs: Parameters<typeof createReadableStream>
) => {
    const fileReadable = createReadableStream(...createReadableStreamArgs);
    const { encryptedKey, iv, cipherivTransform } = createFileEncryptTransformStream(publicKey);

    const transformStream = new TransformStream<Uint8Array, Uint8Array>();
    const writer = transformStream.writable.getWriter();
    writer.write(encryptedKey);
    writer.write(iv);
    writer.releaseLock();

    return fileReadable.pipeThrough(cipherivTransform).pipeThrough(transformStream);
};
