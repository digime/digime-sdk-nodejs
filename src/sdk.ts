/*!
 * © World Data Exchange. All rights reserved.
 */

/**
 * This interface specifies all the functions available after the SDK is initialised.
 * @module SDK
 */

import { DeleteUserOptions, DeleteUserResponse } from "./delete-user";
import { DeleteAccountOptions, DeleteAccountResponse } from "./delete-account";
import {
    GetRevokeAccountPermissionUrlOptions,
    GetRevokeAccountPermissionUrlResponse,
} from "./get-revoke-account-permission-url";
import { ExchangeCodeForTokenOptions } from "./exchange-code-for-token";
import { GetAuthorizeUrlResponse, GetAuthorizeUrlOptions } from "./get-authorize-url";
import { GetOnboardServiceUrlOptions, GetOnboardServiceUrlResponse } from "./get-onboard-service-url";
import { GetReauthorizeAccountUrlOptions, GetReauthorizeAccountUrlResponse } from "./get-reauthorize-account-url";
import { ReadAccountsOptions, ReadAccountsResponse } from "./read-accounts";
import { ReadAllFilesOptions, ReadAllFilesResponse } from "./read-all-files";
import { ReadFileOptions, ReadFileResponse } from "./read-file";
import { ReadFileMetadataOptions, ReadFileMetadataResponse } from "./read-file-metadata";
import { ReadFileListOptions, ReadFileListResponse } from "./read-file-list";
import { ReadSessionOptions, ReadSessionResponse } from "./read-session";
import { UserAccessToken } from "./types/user-access-token";
import { PushDataOptions } from "./push";
import { GetPortabilityReportOptions, GetPortabilityReportResponse } from "./get-portability-report";
import { GetServiceSampleDataSetsOptions, GetServiceSampleDataSetsResponse } from "./get-service-sample-datasets";
import { RefreshTokenOptions } from "./refresh-token";
import { QuerySourcesOptions, QuerySourcesResponse } from "./query-sources";
import { QueryCountriesOptions, QueryCountriesResponse } from "./query-countries";
import { QueryPlatformsOptions, QueryPlatformsResponse } from "./query-platforms";
import { QueryCategoriesOptions, QueryCategoriesResponse } from "./query-categories";
import {
    CreateProvisionalStorageOptions,
    CreateProvisionalStorageResponse,
    ListStorageFilesOptions,
    ListStorageFilesResponse,
    DownloadStorageFileOptions,
    DownloadStorageFileResponse,
    DeleteStorageFilesOptions,
    DeleteStorageFilesResponse,
    UploadFileToStorageOptions,
    UploadFileToStorageResponse,
    GetUserStorageResponse,
    GetUserStorageOptions,
} from "./storage";
import { GetReauthorizeUrlOptions, GetReauthorizeUrlResponse } from "./get-reauthorize-url";
import { GetContractDetailsOptions, GetContractDetailsResponse } from "./get-contract-details";

export interface DigimeSDK {
    /**
     * In order to push or read data from digi.me, we first need to create an access token. Access tokens are linked to a contract, and it is possible to create multiple access tokens that access to the same digi.me libary. This function is called when:
     * * Authorize a new user. You have the option to also onboard a service during this process.
     * * An existing user authorizing a new contract.
     * * Existing user’s refresh token has expired and we need to extend it.
     *
     * ```typescript
     * // run typedoc --help for a list of supported languages
     * const instance = new MyClass();
     * ```
     *
     * @category Authorization
     */
    getAuthorizeUrl: (props: GetAuthorizeUrlOptions) => Promise<GetAuthorizeUrlResponse>;

    /**
     * This is called when user receives InvalidToken error (401 - The token (refresh_token) is invalid). We can use this method to get new AT/RT pair.
     *
     * @category Authorization
     */
    getReauthorizeUrl: (props: GetReauthorizeUrlOptions) => Promise<GetReauthorizeUrlResponse>;

    /**
     * This is called when we already have a valid user access token for this user and we want to add more services to this user’s library.
     *
     * @category Authorization
     */
    getOnboardServiceUrl: (props: GetOnboardServiceUrlOptions) => Promise<GetOnboardServiceUrlResponse>;

    /**
     * This is called when we need to reauthorize specific account due to Service authorization required error
     *
     * @category Authorization
     */
    getReauthorizeAccountUrl: (props: GetReauthorizeAccountUrlOptions) => Promise<GetReauthorizeAccountUrlResponse>;

    /**
     * This is called when authorization flow successfully completed, and you have been given an authorization code. We can then use this function to exchange for an access token.
     *
     * @category Authorization
     */
    exchangeCodeForToken: (props: ExchangeCodeForTokenOptions) => Promise<UserAccessToken>;

    /**
     * This is called if you want to issue new token
     *
     * @category Authorization
     */
    refreshToken: (props: RefreshTokenOptions) => Promise<UserAccessToken>;

    /**
     * Push something to the user's digi.me library or to provider
     *
     * @category Push
     */
    pushData: (props: PushDataOptions) => Promise<void>;

    /**
     * Start a new read session. When we already have an user access token.
     *
     * @category Read
     */
    readSession: (props: ReadSessionOptions) => Promise<ReadSessionResponse>;

    /**
     * Download a file.
     *
     * @category Read
     */
    readFile: (props: ReadFileOptions) => Promise<ReadFileResponse>;

    /**
     * Download a file metadata.
     *
     * @category Read
     */
    readFileMetadata: (props: ReadFileMetadataOptions) => Promise<ReadFileMetadataResponse>;

    /**
     * Get a list of files that are ready to be downloaded.
     *
     * @category Read
     */
    readFileList: (props: ReadFileListOptions) => Promise<ReadFileListResponse>;

    /**
     * Handy util function to download all available user files.
     *
     * @category Read
     */
    readAllFiles: (props: ReadAllFilesOptions) => ReadAllFilesResponse;

    /**
     * Get a list of accounts that exist of current user's library.
     *
     * @category Read
     */
    readAccounts: (props: ReadAccountsOptions) => Promise<ReadAccountsResponse>;

    /**
     * Deletes user data on digi.me
     *
     * @category Delete
     */
    deleteUser: (props: DeleteUserOptions) => Promise<DeleteUserResponse>;

    /**
     * Deletes account on digi.me
     *
     * @category Delete
     */
    deleteAccount: (props: DeleteAccountOptions) => Promise<DeleteAccountResponse>;

    /**
     * Revoke account permission
     *
     * @category Authorization
     */
    getRevokeAccountPermissionUrl: (
        props: GetRevokeAccountPermissionUrlOptions
    ) => Promise<GetRevokeAccountPermissionUrlResponse>;

    /**
     * Get a list of possible sources a user can onboard
     *
     * @category Read
     */
    querySources: (props: QuerySourcesOptions) => Promise<QuerySourcesResponse>;

    /**
     * Get a list of possible countries
     *
     * @category Read
     */
    queryCountries: (props: QueryCountriesOptions) => Promise<QueryCountriesResponse>;

    /**
     * Get a list of possible platforms
     *
     * @category Read
     */
    queryPlatforms: (props: QueryPlatformsOptions) => Promise<QueryPlatformsResponse>;

    /**
     * Get a list of possible categories
     *
     * @category Read
     */
    queryCategories: (props: QueryCategoriesOptions) => Promise<QueryCategoriesResponse>;

    /**
     * Get Portability Report.
     *
     * @category Other
     */
    getPortabilityReport: (props: GetPortabilityReportOptions) => Promise<GetPortabilityReportResponse>;

    /** Get a list of datasets for given sourceId.
     *
     * @category Read
     */
    getServiceSampleDataSets: (props: GetServiceSampleDataSetsOptions) => Promise<GetServiceSampleDataSetsResponse>;

    /** Create provisional storage
     *
     * @category Storage
     */
    createProvisionalStorage: (props: CreateProvisionalStorageOptions) => Promise<CreateProvisionalStorageResponse>;

    /** List storage files
     *
     * @category Storage
     */
    listStorageFiles: (props: ListStorageFilesOptions) => Promise<ListStorageFilesResponse>;

    /** Download file from storage by path
     *
     * @category Storage
     */
    downloadStorageFile: (props: DownloadStorageFileOptions) => Promise<DownloadStorageFileResponse>;

    /** Download file from storage by path
     *
     * @category Storage
     */
    deleteStorageFiles: (props: DeleteStorageFilesOptions) => Promise<DeleteStorageFilesResponse>;

    /** Upload file to storage by path
     *
     * @category Storage
     */
    uploadFileToStorage: (props: UploadFileToStorageOptions) => Promise<UploadFileToStorageResponse>;

    /** Get storage for existing user
     *
     * @category Storage
     */
    getUserStorage: (props: GetUserStorageOptions) => Promise<GetUserStorageResponse>;

    /** Get contract details
     *
     * @category Authorization
     */
    getContractDetails: (props: GetContractDetailsOptions) => Promise<GetContractDetailsResponse>;
}
