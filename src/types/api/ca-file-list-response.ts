/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import * as t from "io-ts";
import { codecAssertion, CodecAssertion } from "../../utils/codec-assertion";
import { FileDataSchema, FileDataSchemaCodec } from "./ca-file-response";

/*
 * AccountSyncStatus
 */

type AccountSyncStatus = "running" | "partial" | "completed";

const AccountSyncStatusCodec: t.Type<AccountSyncStatus> = t.keyof({
    running: null,
    partial: null,
    completed: null,
});

/*
 * LibrarySyncStatus
 */

type LibrarySyncStatus = "running" | "partial" | "completed" | "pending";

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

/*
 * AccountSyncStatusEntry
 */

interface AccountSyncStatusEntry {
    state: AccountSyncStatus;
}

const AccountSyncStatusEntryCodec: t.Type<AccountSyncStatusEntry> = t.type({
    state: AccountSyncStatusCodec,
});

/*
 * CAFileListResponse
 */

export interface CAFileListResponse {
    status: {
        state: LibrarySyncStatus;
        details?: Record<string, AccountSyncStatusEntry>;
    };
    fileList?: CAFileListEntry[];
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
    }),
]);

export const isCAFileListResponse = CAFileListResponseCodec.is;

export const assertIsCAFileListResponse: CodecAssertion<CAFileListResponse> = codecAssertion(CAFileListResponseCodec);
