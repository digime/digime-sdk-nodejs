/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";
import { FileDataSchema } from "../schemas/api/permission-access/query/session-key/file/schemas";

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
        statusCode: z.string(),
        message: z.string(),
        reauth: z.boolean().optional(),
        retryAfter: z.number().optional(),
        objectTypeErrors: z.array(ObjectTypeError).optional(),
    })
    .passthrough();

const AccountSyncStateRunning = z.object({ state: z.literal("running") }).passthrough();

const AccountSyncStatePartial = z.object({ state: z.literal("partial"), error: PartialError }).passthrough();

const AccountSyncStateCompleted = z.object({ state: z.literal("completed") }).passthrough();

const AccountSyncStates = z.union([AccountSyncStateRunning, AccountSyncStatePartial, AccountSyncStateCompleted]);

const FileListFile = z
    .object({
        name: z.string(),
        updatedDate: z.number(),
        schema: FileDataSchema.optional(),
    })
    .passthrough();

export const FileList = z.object({
    status: z
        .object({
            state: UserSyncStates,
            details: z.record(z.string(), AccountSyncStates).optional(),
        })
        .passthrough(),
    fileList: z.array(FileListFile).optional(),
});

export type FileList = z.infer<typeof FileList>;

/**
 * `<instance>.readFileList()` input parameters
 */
export const ReadFileListParameters = z.object({
    /** SessionKey of the session you wish to read the file list for */
    sessionKey: z.string(),

    /** AbortSignal to abort this operation */
    signal: z.instanceof(AbortSignal).optional(),
});

export type ReadFileListParameters = z.infer<typeof ReadFileListParameters>;
