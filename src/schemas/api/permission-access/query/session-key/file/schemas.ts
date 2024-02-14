/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";

export const DataStandard = z.union([z.literal("digime"), z.literal("fhir")]);

export const FileDataSchema = z
    .object({
        version: z.string(),
        id: z.string().optional(),
        standard: DataStandard,
    })
    .passthrough();

export const MappedFileMetadata = z
    .object({
        objectCount: z.number(),
        objectType: z.string(),
        serviceGroup: z.string(),
        serviceName: z.string(),
        schema: FileDataSchema,

        // TODO: Get consultation
        /** @deprecated this will be removed in next major update. New schema prop should be used. */
        objectVersion: z.string(),
    })
    .passthrough();

export const RawFileMetadata = z
    .object({
        mimetype: z.string(),
        accounts: z.array(
            z.object({
                accountid: z.string(),
            }),
        ),
        appid: z.string().optional(),
        created: z.number().optional(),
        contractid: z.string().optional(),
        objecttypes: z
            .array(
                z.object({
                    name: z.string(),
                    references: z.array(z.string()).optional(),
                }),
            )
            .optional(),
        partnerid: z.string().optional(),
        reference: z.array(z.string()).optional(),
        servicegroups: z.array(z.number()).optional(),
        tags: z.array(z.string()).optional(),
    })
    .passthrough();

export const AnyFileMetadata = z.union([MappedFileMetadata, RawFileMetadata]);

export const FileHeaderMetadata = z
    .object({
        metadata: AnyFileMetadata,
        compression: z.union([z.literal("brotli"), z.literal("gzip")]).optional(),
    })
    .passthrough();

export type FileHeaderMetadata = z.infer<typeof FileHeaderMetadata>;
