/*!
 * Copyright (c) 2009-2018 digi.me Limited. All rights reserved.
 */

/*!
 * Copyright (c) 2009-2019 digi.me Limited. All rights reserved.
 */

import { PartialAttemptOptions } from "@lifeomic/attempt";

export interface DMESDKConfiguration {
    baseUrl: string;
    retryOptions?: PartialAttemptOptions<any>;
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
