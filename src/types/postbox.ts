/*!
 * Copyright (c) 2009-2020 digi.me Limited. All rights reserved.
 */

import * as t from "io-ts";
import { codecAssertion, CodecAssertion } from "../codec-assertion";

export interface PushedFileMeta {
    fileData: Buffer;
    fileName: string;
    fileDescriptor: {
        mimeType: string;
        accounts: Array<{
            accountId: string;
        }>;
        reference?: string[];
        tags?: string[];
    };
}

const buffer = new t.Type<Buffer, Buffer, unknown>(
    'Buffer',
    (input: unknown): input is Buffer => Buffer.isBuffer(input),
    // `t.success` and `t.failure` are helpers used to build `Either` instances
    (input, context) => (Buffer.isBuffer(input) ? t.success(input) : t.failure(input, context)),
    // `A` and `O` are the same, so `encode` is just the identity function
    t.identity,
  )

export const PushedFileMetaCodec: t.Type<PushedFileMeta> = t.type({
    fileData: buffer,
    fileName: t.string,
    fileDescriptor: t.intersection([
        t.type({
            mimeType: t.string,
            accounts: t.array(t.type({
                accountId: t.string,
            })),
        }),
        t.partial({
            reference: t.array(t.string),
            tags: t.array(t.string),
        }),
    ]),
});

export const isPushedFileMeta = PushedFileMetaCodec.is;

export const assertIsPushedFileMeta: CodecAssertion<PushedFileMeta> = codecAssertion(PushedFileMetaCodec);
