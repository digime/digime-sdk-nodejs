/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import NodeRSA from "node-rsa";
import { Session } from "./sdk";
import { MappedFileMetadata, RawFileMetadata } from "./types/api/ca-file-response";
import { PushDataToPostboxAPIResponse } from "./types/api/postbox-response";
import { UserAccessToken } from "./types/user-access-token";

export interface AuthorizeResponse {
    codeVerifier: string;
    code: string;
    session: Session;
}

export interface AuthorizeOptions {
    userAccessToken?: UserAccessToken;
    state?: any;
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
    fileData: Buffer;
    fileName: string;
    fileMetadata: MappedFileMetadata | RawFileMetadata;
}

export interface PushedFileMeta {
    fileData: Buffer;
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

export interface GetReceiptOptions {
    applicationId: string;
    contractId: string;
}

export interface PushDataToPostboxOptions{
    userAccessToken?: UserAccessToken;
    data: PushedFileMeta;
    publicKey: NodeRSA.Key;
    postboxId: string;
    sessionKey: string;
}

export interface ExchangeCodeForTokenOptions {
    codeVerifier?: string;
    authorizationCode: string,
}

export interface RefreshTokenOptions {
    userAccessToken: UserAccessToken;
}

export interface UserLibraryAccessResponse {
    session: Session;
    updatedAccessToken?: UserAccessToken;
}

export interface PushDataToPostboxResponse extends PushDataToPostboxAPIResponse {
    updatedAccessToken?: UserAccessToken;
}

export interface PrepareFilesUsingAccessTokenOptions {
    userAccessToken: UserAccessToken;
}

export interface GetAuthorizationUrlResponse {
    url: string;
    codeVerifier: string;
    session: Session;
}

export interface UserDataAccessOptions {
    sessionKey: string;
    privateKey: NodeRSA.Key;
}

export interface GetFileOptions extends UserDataAccessOptions {
    fileName: string;
}

export interface GetFileListOptions {
    sessionKey: string;
}

export interface GetSessionDataOptions {
    sessionKey: string,
    privateKey: NodeRSA.Key,
    onFileData: FileSuccessHandler,
    onFileError: FileErrorHandler,
}

type FileSuccessResult = { data: any } & FileMeta;
type FileErrorResult = { error: Error } & FileMeta;
type FileSuccessHandler = (response: FileSuccessResult) => void;
type FileErrorHandler = (response: FileErrorResult) => void;

export interface DiscoveryService {
    id: number;
    name: string;
    serviceGroups: Array<{ id: number }>;
    serviceId: number;
    platform: Record<
        string,
        {
            availability: string;
            currentStatus: string;
        }
    >;
}

export interface DiscoveryServiceGroup {
    id: number;
    name: string;
}

export interface DiscoveryApiServicesData {
    serviceGroups: DiscoveryServiceGroup[];
    services: DiscoveryService[];
}
