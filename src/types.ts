/*!
 * Copyright (c) 2009-2020 digi.me Limited. All rights reserved.
 */

import NodeRSA from "node-rsa";

export interface PrivateShareConfiguration {
    applicationId: string;
    contractId: string;
    privateKey: NodeRSA.Key;
}

export interface OngoingAccessConfiguration extends PrivateShareConfiguration {
    redirectUri: string;
}

export interface OngoingAccessAuthorization extends OngoingAccessConfiguration {
    accessToken?: UserAccessToken;
    state?: string;
}

export interface CAScope {
    timeRanges?: TimeRange[];
    serviceGroups?: ServiceGroup[];
}

export interface TimeRange {
    from?: number;
    last?: string;
    to?: number;
}

export interface ServiceGroup {
    id: number;
    serviceTypes: Service[];
}

export interface Service {
    id: number;
    serviceObjectTypes: ServiceObject[];
}

export interface ServiceObject {
    id: number;
}

export interface FileMeta {
    fileData: any;
    fileName: string;
    fileMetadata: {
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

export interface UserAccessToken {
    accessToken: string;
    refreshToken: string;
    expiry: number;
}
