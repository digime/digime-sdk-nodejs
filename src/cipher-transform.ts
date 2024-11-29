/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import crypto from "node:crypto";
import stream from "node:stream";

export class CipherTransform extends stream.Transform {
    private cipher: crypto.Cipher;
    private chunksToPrepend: Buffer[] = [];

    constructor(privateKey: string, opts?: stream.TransformOptions) {
        super(opts);
        const dataEncryptionKey = crypto.randomBytes(32);
        const initialisationVector = crypto.randomBytes(16);
        const encryptedKey = crypto.publicEncrypt(privateKey, dataEncryptionKey);
        this.chunksToPrepend.push(encryptedKey, initialisationVector);
        this.cipher = crypto.createCipheriv("aes-256-cbc", dataEncryptionKey, initialisationVector);
    }

    public _transform(chunk: Buffer, _encoding: string, callback: stream.TransformCallback): void {
        if (this.chunksToPrepend.length > 0) {
            for (const c of this.chunksToPrepend) {
                this.push(c);
            }
            this.chunksToPrepend = [];
        }
        this.push(this.cipher.update(chunk));
        return callback();
    }

    public _flush(callback: stream.TransformCallback) {
        try {
            this.push(this.cipher.final());
        } catch (error_) {
            const error = error_ === null ? error_ : (error_ as Error);
            return callback(error);
        }
        callback();
    }

    public _destroy(error: Error | null, callback: (error: Error | null) => void): void {
        this.chunksToPrepend = [];
        callback(error);
    }
}
