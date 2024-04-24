/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import crypto from "crypto";
import stream from "stream";

type HeaderConfig = {
    encryptedKey: { length: number };
    initialisationVector: { length: number };
};

type DecipherParam = keyof HeaderConfig;

type HeaderLayout = {
    [keys in DecipherParam]: {
        length: number;
        offset: number;
    };
};
type DecipherParams = { encryptedKey: Buffer; initialisationVector: Buffer };

export class DecipherTransform extends stream.Transform {
    private headerLayout: HeaderLayout;
    private remainingHeaderLength: number;

    private headerChunks: Buffer[] = [];
    private decipher: crypto.Decipher | undefined;

    constructor(
        private privateKey: string,
        opts?: stream.TransformOptions
    ) {
        super(opts);
        const headerConfig = {
            encryptedKey: { length: 256 },
            initialisationVector: { length: 16 },
        };
        this.headerLayout = {
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
            this.headerLayout.encryptedKey.length + this.headerLayout.initialisationVector.length;
    }

    public _transform(chunk: Buffer, _encoding: string, callback: stream.TransformCallback): void {
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

                this.decipher = this.buildDecipher(this.extractDecipherParams(headerBuffer));
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
            } catch (e) {
                const error = e === null ? e : (e as Error);
                return callback(error);
            }
        }
        callback();
    }

    public _destroy(error: Error | null, callback: (error: Error | null) => void): void {
        this.decipher = undefined;
        this.headerChunks = [];
        callback(error);
    }

    private buildDecipher({ encryptedKey, initialisationVector }: DecipherParams): crypto.Decipher {
        const dataEncryptionKey = crypto.privateDecrypt(this.privateKey, encryptedKey);
        return crypto.createDecipheriv("aes-256-cbc", dataEncryptionKey, initialisationVector);
    }

    private extractDecipherParams(headerBuffer: Buffer): DecipherParams {
        return {
            encryptedKey: this.extractParam("encryptedKey", headerBuffer),
            initialisationVector: this.extractParam("initialisationVector", headerBuffer),
        };
    }

    private extractParam(param: DecipherParam, headerBuffer: Buffer): Buffer {
        const from = this.headerLayout[param].offset;
        const to = from + this.headerLayout[param].length;
        return headerBuffer.subarray(from, to);
    }
}
