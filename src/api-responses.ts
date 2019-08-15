/*!
 * Copyright (c) 2009-2019 digi.me Limited. All rights reserved.
 */

export interface GetFileListResponse {
    status: {
        state: LibrarySyncStatus;
        details: unknown[];
    };
    fileList: {
        name: string;
        updated: number;
    }[];
}

export type AccountSyncStatus = "running" | "partial" | "completed";
export type LibrarySyncStatus = AccountSyncStatus | "pending";
