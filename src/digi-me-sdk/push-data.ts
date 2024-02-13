/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";

const FileDescriptor = z.object({
    mimeType: z.string(),
    accounts: z.array(z.object({ accountId: z.string() })),
    reference: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
});

const PushDataOptionsToLibrary = z.object({
    type: z.literal("library"),
    fileDescriptor: FileDescriptor,
    data: z.instanceof(ReadableStream),
    signal: z.instanceof(AbortSignal).optional(),
});

const PushDataOptionsToProvider = z.object({
    type: z.literal("provider"),
    data: z.record(z.string(), z.unknown()),
    version: z.union([z.literal("stu3"), z.literal("3.0.2")]),
    standard: z.literal("fhir"),
    accountId: z.string(),
    signal: z.instanceof(AbortSignal).optional(),
});

export const PushDataOptions = z.union([PushDataOptionsToLibrary, PushDataOptionsToProvider]);

export type PushDataOptions = z.infer<typeof PushDataOptions>;
