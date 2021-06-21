/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import * as t from "io-ts";
import { codecAssertion, CodecAssertion } from "../../utils/codec-assertion";

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

interface CAFileListEntry {
    name: string;
    updatedDate: number;
}

const CAFileListEntryCodec: t.Type<CAFileListEntry> = t.type({
    name: t.string,
    updatedDate: t.number,
});

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
