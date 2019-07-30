/*!
 * Copyright (c) 2009-2019 digi.me Limited. All rights reserved.
 */

import { RetryOptions } from "got";

export interface DMESDKConfiguration {
    baseUrl: string;
    retryOptions?: RetryOptions;
}

export interface Session {
    expiry: number;
    sessionKey: string;
    sessionExchangeToken: string;
}

export interface CAScope {
    timeRanges?: TimeRange[];
}

export interface TimeRange {
    from?: number;
    last?: string;
    to?: number;
}

export interface FileMeta {
    fileData: any;
    fileName: string;
    fileDescriptor: {
        objectCount: number;
        objectType: string;
        serviceGroup: string;
        serviceName: string;
    };
}

export interface PushedFileMeta {
    fileData: any;
    fileName: string;
    fileDescriptor: {
        mimeType: string;
        accounts: Array<{
            accountId: string;
        }>;
        reference?: string[];
        tags?: string[];
    };
}

export interface GetSessionDataResponse {
    stopPolling: () => void;
    filePromise: Promise<any>;
}
