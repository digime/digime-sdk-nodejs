/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import NodeRSA from "node-rsa";
import { Session } from "./sdk";
import { MappedFileMetadata, RawFileMetadata } from "./types/api/ca-file-response";
import { PushDataToPostboxAPIResponse } from "./types/api/postbox-response";

export interface AuthorizeResponse {
    codeVerifier: string;
    preauthorizationCode: string;
}

export interface AuthorizeOptions extends BasicOAuthOptions {
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

export interface UserAccessToken {
    accessToken: string;
    refreshToken: string;
    expiry: number;
}

export interface BasicOAuthOptions {
    applicationId: string;
    contractId: string;
    privateKey: NodeRSA.Key;
    redirectUri: string;
}

export interface EstablishSessionOptions {
    applicationId: string;
    contractId: string;
    scope?: CAScope;
}

export interface GetReceiptOptions {
    applicationId: string;
    contractId: string;
}

export interface PushDataToPostboxOptions extends BasicOAuthOptions {
    userAccessToken?: UserAccessToken;
    data: PushedFileMeta;
    publicKey: NodeRSA.Key;
    postboxId: string;
    sessionKey: string;
}

export interface ExchangeCodeForTokenOptions extends BasicOAuthOptions {
    codeVerifier?: string;
    authorizationCode: string,
}

export interface RefreshTokenOptions extends BasicOAuthOptions {
    userAccessToken: UserAccessToken;
}

export interface UserLibraryAccessResponse {
    success: boolean;
    updatedAccessToken?: UserAccessToken;
}

export interface PushDataToPostboxResponse extends PushDataToPostboxAPIResponse {
    updatedAccessToken?: UserAccessToken;
}

export interface ConsentOngoingAccessOptions extends BasicOAuthOptions {
    state?: any;
    session: Session;
}

export interface ConsentOnceOptions {
    callbackUrl?: any;
    session: Session;
    applicationId: string;
}

export interface GuestConsentProps extends Omit<ConsentOnceOptions, "applicationId"> {}

export interface PrepareFilesUsingAccessTokenOptions extends BasicOAuthOptions {
    userAccessToken: UserAccessToken;
    session: Session;
}

export interface GetAuthorizationUrlResponse {
    url: string;
    codeVerifier: string;
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
