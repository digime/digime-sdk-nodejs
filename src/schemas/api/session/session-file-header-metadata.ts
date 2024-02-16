/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";
import { SessionFileDataSchema } from "./session-file-data-schema";

/**
 * Metadata for mapped files
 */
export const SessionFileMetadataMapped = z
    .object({
        objectCount: z.number(),
        objectType: z.string(),
        serviceGroup: z.string(),
        serviceName: z.string(),
        schema: SessionFileDataSchema,

        // TODO: Get consultation
        /** @deprecated this will be removed in next major update. New schema prop should be used. */
        objectVersion: z.string(),
    })
    .passthrough();

export type SessionFileMetadataMapped = z.infer<typeof SessionFileMetadataMapped>;

/**
 * Metadata for raw files
 */
export const SessionFileMetadataRaw = z
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

export type SessionFileMetadataRaw = z.infer<typeof SessionFileMetadataRaw>;

export const AnySessionFileMetadata = z.union([SessionFileMetadataMapped, SessionFileMetadataRaw]);

export const SessionFileHeaderMetadata = z
    .object({
        metadata: AnySessionFileMetadata,
        compression: z.union([z.literal("brotli"), z.literal("gzip")]).optional(),
    })
    .passthrough();

export type SessionFileHeaderMetadata = z.infer<typeof SessionFileHeaderMetadata>;
