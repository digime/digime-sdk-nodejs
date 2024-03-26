/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";
import { SessionFileDataSchema } from "./session-file-data-schema";

const UserSyncStates = z.union([
    z.literal("running"),
    z.literal("partial"),
    z.literal("completed"),
    z.literal("pending"),
]);

const ObjectTypeError = z
    .object({
        objectType: z.number(),
        error: z
            .object({
                code: z.string(),
                message: z.string(),
                statusCode: z.number(),
            })
            .passthrough(),
    })
    .passthrough();

const PartialError = z
    .object({
        code: z.string(),
        statusCode: z.number(),
        message: z.string(),
        reauth: z.boolean().optional(),
        retryAfter: z.number().optional(),
        objectTypeErrors: z.array(ObjectTypeError).optional(),
    })
    .passthrough();

const AccountSyncStateRunning = z.object({ state: z.literal("running") }).passthrough();

const AccountSyncStatePartial = z.object({ state: z.literal("partial"), error: PartialError }).passthrough();

const AccountSyncStateCompleted = z.object({ state: z.literal("completed") }).passthrough();

const AccountSyncStates = z.discriminatedUnion("state", [
    AccountSyncStateRunning,
    AccountSyncStatePartial,
    AccountSyncStateCompleted,
]);

const FileListFile = z
    .object({
        name: z.string(),
        updatedDate: z.number(),
        schema: SessionFileDataSchema.optional(),
    })
    .passthrough();

export const SessionFileList = z.object({
    status: z
        .object({
            state: UserSyncStates,
            details: z.record(z.string(), AccountSyncStates).optional(),
        })
        .passthrough(),
    fileList: z.array(FileListFile).optional(),
});

export type SessionFileList = z.infer<typeof SessionFileList>;
