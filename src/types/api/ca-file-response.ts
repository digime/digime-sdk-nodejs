/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import * as t from "io-ts";
import { codecAssertion, CodecAssertion } from "../../utils/codec-assertion";

export interface MappedFileMetadata {
    objectCount: number;
    objectType: string;
    serviceGroup: string;
    serviceName: string;
}

export interface RawFileMetadata {
    mimetype: string;
    accounts: {
        accountid: string;
    }[];
    appid?: string;
    created?: number;
    contractid?: string;
    objecttypes?: {
        name: string;
        references?: string[];
    }[];
    partnerid?: string;
    reference?: string[];
    servicegroups?: number[];
    tags?: string[];
    [key: string]: unknown;
}

const MappedFileMetadataCodec: t.Type<MappedFileMetadata> = t.type({
    objectCount: t.number,
    objectType: t.string,
    serviceGroup: t.string,
    serviceName: t.string,
});

const RawFileMetadataCodec: t.Type<RawFileMetadata> = t.intersection([
    t.type({
        accounts: t.array(
            t.type({
                accountid: t.string,
            })
        ),
        mimetype: t.string,
    }),
    t.partial({
        appid: t.string,
        created: t.number,
        contractid: t.string,
        objecttypes: t.array(
            t.intersection([
                t.type({
                    name: t.string,
                }),
                t.partial({
                    references: t.array(t.string),
                }),
            ])
        ),
        partnerid: t.string,
        reference: t.array(t.string),
        servicegroups: t.array(t.number),
        tags: t.array(t.string),
    }),
]);

export const isMappedFileMetadata = MappedFileMetadataCodec.is;

export const assertIsMappedFileMetadata: CodecAssertion<MappedFileMetadata> = codecAssertion(MappedFileMetadataCodec);

export const isRawFileMetadata = RawFileMetadataCodec.is;

export const assertIsRawFileMetadata: CodecAssertion<RawFileMetadata> = codecAssertion(RawFileMetadataCodec);

export interface CAFileHeaderResponse {
    "x-metadata": string;
}

const FileHeaderCodec: t.Type<CAFileHeaderResponse> = t.type({
    "x-metadata": t.string,
});

export const assertIsCAFileHeaderResponse: CodecAssertion<CAFileHeaderResponse> = codecAssertion(FileHeaderCodec);

export interface DecodedCAFileHeaderResponse {
    fileMetadata: MappedFileMetadata | RawFileMetadata;
    compression?: string;
}

const DecodedCAFileHeaderResponseCodec: t.Type<DecodedCAFileHeaderResponse> = t.intersection([
    t.type({
        fileMetadata: t.union([MappedFileMetadataCodec, RawFileMetadataCodec]),
    }),
    t.partial({
        compression: t.string,
    }),
]);

export const isDecodedCAFileHeaderResponse = DecodedCAFileHeaderResponseCodec.is;
