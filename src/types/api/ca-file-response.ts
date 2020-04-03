/*!
 * Copyright (c) 2009-2020 digi.me Limited. All rights reserved.
 */

import * as t from "io-ts";
import { codecAssertion, CodecAssertion } from "../../codec-assertion";

interface FileMetadata {
    objectCount: number;
    objectType: string;
    serviceGroup: string;
    serviceName: string;
    mimetype?: string;
}

const FileMetadataCodec: t.Type<FileMetadata> = t.intersection([
    t.type({
        objectCount: t.number,
        objectType: t.string,
        serviceGroup: t.string,
        serviceName: t.string,
    }),
    t.partial({
        mimetype: t.string,
    }),
]);

export interface CAFileResponse {
    fileContent: string;
    fileMetadata: FileMetadata;
    compression?: string;
};

const CAFileResponseCodec: t.Type<CAFileResponse> = t.intersection([
    t.type({
        fileContent: t.string,
        fileMetadata: FileMetadataCodec,
    }),
    t.partial({
        compression: t.string,
    }),
]);

export const isCAFileResponse = CAFileResponseCodec.is;

export const assertIsCAFileResponse: CodecAssertion<CAFileResponse> = codecAssertion(CAFileResponseCodec);
