/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import crypto from "crypto";
import NodeRSA from "node-rsa";
import { FileDecryptionError } from "./errors";
import stream from "stream";

class BufferPrependTransform extends stream.Transform {
    private chunksToPrepend: Buffer[];
    constructor(chunks: Buffer[], options = {}) {
        super(options);
        this.chunksToPrepend = chunks;
    }

    _transform(chunk: Buffer, _encoding: string, callback: stream.TransformCallback): void {
        if (this.chunksToPrepend.length > 0) {
            for (const c of this.chunksToPrepend) {
                this.push(c);
            }
            this.chunksToPrepend = [];
        }
        this.push(chunk);
        return callback();
    }
}

type HeaderConfig = {
    encryptedKey: { length: number };
    initialisationVector: { length: number };
};

type DecipherParam = keyof HeaderConfig;

type HeaderConfigInternal = {
    [keys in DecipherParam]: {
        length: number;
        offset: number;
    };
};
type DecipherParams = { encryptedKey: Buffer; initialisationVector: Buffer };
type DecipherBuilder = (params: DecipherParams) => crypto.Decipher;

class HeaderDependentDecipher extends stream.Transform {
    private headerConfig: HeaderConfigInternal;
    private dechipherBuilder: DecipherBuilder;
    private remainingHeaderLength: number;

    private headerChunks: Buffer[] = [];
    private decipher: crypto.Decipher | undefined;

    constructor(headerConfig: HeaderConfig, dechipherBuilder: DecipherBuilder, options = {}) {
        super(options);
        this.headerConfig = {
            encryptedKey: {
                length: headerConfig.encryptedKey.length,
                offset: 0,
            },
            initialisationVector: {
                length: headerConfig.initialisationVector.length,
                offset: headerConfig.encryptedKey.length,
            },
        };
        this.remainingHeaderLength =
            this.headerConfig.encryptedKey.length + this.headerConfig.initialisationVector.length;
        this.dechipherBuilder = dechipherBuilder;
    }

    public _transform(chunk: Buffer, _encoding: string, callback: stream.TransformCallback): void {
        // TODO: ensure Buffer encoding
        if (this.decipher) {
            this.push(this.decipher.update(chunk));
        } else {
            let chunkTail: Buffer | undefined = undefined;
            if (chunk.length >= this.remainingHeaderLength) {
                this.headerChunks.push(chunk.subarray(0, this.remainingHeaderLength));
                chunkTail = chunk.subarray(this.remainingHeaderLength);
                this.remainingHeaderLength = 0;
            } else {
                this.headerChunks.push(chunk);
                this.remainingHeaderLength -= chunk.length;
            }
            if (this.remainingHeaderLength == 0) {
                const headerBuffer = Buffer.concat(this.headerChunks);
                const params: DecipherParams = {
                    encryptedKey: this.extractParam("encryptedKey", headerBuffer),
                    initialisationVector: this.extractParam("initialisationVector", headerBuffer),
                };
                this.decipher = this.dechipherBuilder(params);
                if (chunkTail && chunkTail.length > 0) {
                    this.push(this.decipher.update(chunkTail));
                }
            }
        }
        return callback();
    }

    public _flush(callback: stream.TransformCallback) {
        if (this.decipher) {
            try {
                this.push(this.decipher.final());
            } catch (error) {
                const err = error === null ? error : (error as Error);
                return callback(err);
            }
        }
        callback();
    }

    public _destroy(error: Error | null, callback: (error: Error | null) => void): void {
        this.decipher = undefined;
        this.headerChunks = [];
        callback(error);
    }

    private extractParam(param: DecipherParam, headerBuffer: Buffer): Buffer {
        const from = this.headerConfig[param].offset;
        const to = from + this.headerConfig[param].length;
        return headerBuffer.subarray(from, to);
    }
}

const BYTES = {
    DSK: [0, 256],
    DIV: [256, 272],
    DATA: [272],
};

const ALPHA_LOWER = `abcdefghijklmnopqrstuvwxyz`;
const ALPHA_UPPER: string = ALPHA_LOWER.toUpperCase();
const NUMERIC = `0123456789`;
const ALPHA_NUMERIC = `${ALPHA_LOWER}${ALPHA_UPPER}${NUMERIC}`;

const isValidSize = (data: Buffer): boolean => {
    const bytes = data.length;
    return bytes >= 288 && bytes % 16 === 0;
};

const decryptData = (key: NodeRSA, file: Buffer): Buffer => {
    // Verify file data is of correct length
    if (!isValidSize(file)) {
        throw new FileDecryptionError(`File size not valid: ${file.length}`);
    }

    // Recover DSK and DIV
    const dsk: Buffer = key.decrypt(file.slice(...BYTES.DSK));
    const div: Buffer = file.slice(...BYTES.DIV);

    // Recover concated hash and data
    const decipher = crypto.createDecipheriv("aes-256-cbc", dsk, div);
    const data = Buffer.concat([decipher.update(file.slice(...BYTES.DATA)), decipher.final()]);

    return data;
};

type CipherCallback = (dataStream: stream.Readable) => stream.Readable;

const createEncryptStream = (privateKey: string): CipherCallback => {
    const dataEncryptionKey = crypto.randomBytes(32);
    const encryptedKey = crypto.publicEncrypt(privateKey, dataEncryptionKey);
    const initialisationVector = crypto.randomBytes(16);
    const headerPrependTransform = new BufferPrependTransform([encryptedKey, initialisationVector]);
    const cipherStream = crypto.createCipheriv("aes-256-cbc", dataEncryptionKey, initialisationVector);
    return (dataStream: stream.Readable) => {
        return dataStream.pipe(cipherStream).pipe(headerPrependTransform);
    };
};

const createDecryptStream = (privateKey: string): stream.Transform => {
    const headerConfig = {
        encryptedKey: { length: 256 },
        initialisationVector: { length: 16 },
    };
    return new HeaderDependentDecipher(headerConfig, ({ encryptedKey, initialisationVector }) => {
        const dataEncryptionKey = crypto.privateDecrypt(privateKey, encryptedKey);
        return crypto.createDecipheriv("aes-256-cbc", dataEncryptionKey, initialisationVector);
    });
};

const getRandomAlphaNumeric = (size: number): string => {
    const charsLength: number = ALPHA_NUMERIC.length;
    const value: string[] = Array.from({ length: size });
    for (let i = 0; i < size; i++) {
        let random: number;
        do {
            random = crypto.randomBytes(1).readUInt8(0);
        } while (random > 256 - (256 % charsLength));
        value[i] = ALPHA_NUMERIC[random % charsLength];
    }
    return value.join("");
};

const hashSha256 = (data: string | Buffer): Buffer => crypto.createHash("sha256").update(data).digest();

export { decryptData, getRandomAlphaNumeric, hashSha256, createEncryptStream, createDecryptStream };
