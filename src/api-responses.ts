/*!
 * Copyright (c) 2009-2020 digi.me Limited. All rights reserved.
 */

export interface GetFileListResponse {
    status: {
        state: LibrarySyncStatus;
        details: unknown[];
    };
    fileList: Array<{
        name: string;
        updatedDate: number;
    }>;
}

export interface GetFileResponse {
    fileContent: string;
    fileDescriptor: {
        objectCount: number;
        objectType: string;
        serviceGroup: string;
        serviceName: string;
        mimetype?: string;
    };
    compression?: string;
}

export type AccountSyncStatus = "running" | "partial" | "completed";
export type LibrarySyncStatus = AccountSyncStatus | "pending";
