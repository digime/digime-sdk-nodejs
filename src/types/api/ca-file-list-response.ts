/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import * as t from "io-ts";
import { codecAssertion, CodecAssertion } from "../../utils/codec-assertion";
import { FileDataSchema, FileDataSchemaCodec } from "./ca-file-response";
import { UserAccessToken, UserAccessTokenCodec } from "../user-access-token";

/*
 * LibrarySyncStatus
 */

export type LibrarySyncStatus = "running" | "partial" | "completed" | "pending";

const LibrarySyncStatusCodec: t.Type<LibrarySyncStatus> = t.keyof({
    running: null,
    partial: null,
    completed: null,
    pending: null,
});

/*
 * CAFileListEntry
 */

export interface CAFileListEntry {
    name: string;
    updatedDate: number;
    schema?: FileDataSchema;
}

const CAFileListEntryCodec: t.Type<CAFileListEntry> = t.intersection([
    t.type({
        name: t.string,
        updatedDate: t.number,
    }),
    t.partial({
        schema: FileDataSchemaCodec,
    }),
]);

interface ObjectTypeError {
    error: {
        code: string;
        message: string;
        statusCode: number;
    };
    objectType: number;
}

const ObjectTypeErrorCodec: t.Type<ObjectTypeError> = t.type({
    error: t.type({
        code: t.string,
        message: t.string,
        statusCode: t.number,
    }),
    objectType: t.number,
});

interface PartialError {
    code: string;
    statusCode: number;
    message: string;
    reauth?: boolean;
    retryAfter?: number;
    objectTypeErrors?: ObjectTypeError[];
}

const PartialErrorCodec: t.Type<PartialError> = t.intersection([
    t.type({
        code: t.string,
        statusCode: t.number,
        message: t.string,
    }),
    t.partial({
        reauth: t.boolean,
        retryAfter: t.number,
        objectTypeErrors: t.array(ObjectTypeErrorCodec),
    }),
]);

interface AccountSyncStatusEntryPartial {
    state: "partial";
    error: PartialError;
}

const AccountSyncStatusEntryPartialCodec: t.Type<AccountSyncStatusEntryPartial> = t.type({
    state: t.literal("partial"),
    error: PartialErrorCodec,
});

interface AccountSyncStatusEntryRunning {
    state: "running";
}

const AccountSyncStatusEntryRunningCodec: t.Type<AccountSyncStatusEntryRunning> = t.type({
    state: t.literal("running"),
});

interface AccountSyncStatusEntryCompleted {
    state: "completed";
}

const AccountSyncStatusEntryCompletedCodec: t.Type<AccountSyncStatusEntryCompleted> = t.type({
    state: t.literal("completed"),
});

type AccountSyncStatusEntry =
    | AccountSyncStatusEntryPartial
    | AccountSyncStatusEntryRunning
    | AccountSyncStatusEntryCompleted;

const AccountSyncStatusEntryCodec: t.Type<AccountSyncStatusEntry> = t.union([
    AccountSyncStatusEntryPartialCodec,
    AccountSyncStatusEntryRunningCodec,
    AccountSyncStatusEntryCompletedCodec,
]);

/*
 * CAFileListResponse
 */

export interface CAFileListResponse {
    status: {
        state: LibrarySyncStatus;
        details?: Record<string, AccountSyncStatusEntry>;
    };
    fileList?: CAFileListEntry[];
    userAccessToken?: UserAccessToken;
}

const CAFileListResponseCodec: t.Type<CAFileListResponse> = t.intersection([
    t.type({
        status: t.intersection([
            t.type({
                state: LibrarySyncStatusCodec,
            }),
            t.partial({
                details: t.record(t.string, AccountSyncStatusEntryCodec),
            }),
        ]),
    }),
    t.partial({
        fileList: t.array(CAFileListEntryCodec),
        userAccessToken: UserAccessTokenCodec,
    }),
]);

export const isCAFileListResponse = CAFileListResponseCodec.is;

export const assertIsCAFileListResponse: CodecAssertion<CAFileListResponse> = codecAssertion(CAFileListResponseCodec);
