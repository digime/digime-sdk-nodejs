/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { pushData, PushDataOptions } from "./push";
import { assertIsSDKConfiguration, SDKConfiguration } from "./types/sdk-configuration";
import { getAuthorizeUrl, GetAuthorizeUrlOptions } from "./get-authorize-url";
import { getOnboardServiceUrl, GetOnboardServiceUrlOptions } from "./get-onboard-service-url";
import { addTrailingSlash, isPlainObject } from "./utils/basic-utils";
import { exchangeCodeForToken, ExchangeCodeForTokenOptions } from "./exchange-code-for-token";
import { readSession, ReadSessionOptions } from "./read-session";
import { readFile, ReadFileOptions } from "./read-file";
import { readFileList, ReadFileListOptions } from "./read-file-list";
import { readAllFiles, ReadAllFilesOptions } from "./read-all-files";
import { readAccounts, ReadAccountsOptions } from "./read-accounts";
import { deleteUser, DeleteUserOptions } from "./delete-user";
import { deleteAccount, DeleteAccountOptions } from "./delete-account";
import {
    getRevokeAccountPermissionUrl,
    GetRevokeAccountPermissionUrlOptions,
} from "./get-revoke-account-permission-url";
import { TypeValidationError } from "./errors";
import { DigimeSDK } from "./sdk";
import { getReauthorizeAccountUrl, GetReauthorizeAccountUrlOptions } from "./get-reauthorize-account-url";
import { getPortabilityReport, GetPortabilityReportOptions } from "./get-portability-report";
import { getServiceSampleDataSets, GetServiceSampleDataSetsOptions } from "./get-service-sample-datasets";
import { refreshToken, RefreshTokenOptions } from "./refresh-token";
import { querySources, QuerySourcesOptions } from "./query-sources";
import { queryCountries, QueryCountriesOptions } from "./query-countries";
import { queryPlatforms, QueryPlatformsOptions } from "./query-platforms";
import { queryCategories, QueryCategoriesOptions } from "./query-categories";
import {
    createProvisionalStorage,
    CreateProvisionalStorageOptions,
    listStorageFiles,
    ListStorageFilesOptions,
    downloadStorageFile,
    DownloadStorageFileOptions,
    deleteStorageFiles,
    DeleteStorageFilesOptions,
    UploadFileToStorageOptions,
    uploadFileToStorage,
    GetUserStorageOptions,
    getUserStorage,
} from "./storage";

const CLOUD_BASE_URL = "https://cloud.digi.me/v1/";
const DEFAULT_BASE_URL = "https://api.digi.me/v1.7/";
const DEFAULT_ONBOARD_URL = "https://api.digi.me/apps/saas/";
const DEFAULT_RETRIES_OPTIONS = {
    retries: 5,
};

const init = (config: SDKConfiguration): DigimeSDK => {
    if (!isPlainObject(config)) {
        throw new TypeValidationError("SDK options should be object that contains your application Id");
    }

    const sdkConfig: SDKConfiguration = {
        ...config,
        baseUrl: addTrailingSlash(config.baseUrl) || DEFAULT_BASE_URL,
        cloudBaseUrl: addTrailingSlash(config.cloudBaseUrl) || CLOUD_BASE_URL,
        onboardUrl: addTrailingSlash(config.onboardUrl) || DEFAULT_ONBOARD_URL,
        retryOptions: config.retryOptions || DEFAULT_RETRIES_OPTIONS,
    };

    assertIsSDKConfiguration(sdkConfig);

    if (config.applicationId.length === 0) {
        throw new TypeValidationError("Application Id cannot be an empty string");
    }

    return {
        getAuthorizeUrl: (props: GetAuthorizeUrlOptions) => getAuthorizeUrl(props, sdkConfig),
        getOnboardServiceUrl: (props: GetOnboardServiceUrlOptions) => getOnboardServiceUrl(props, sdkConfig),
        getReauthorizeAccountUrl: (props: GetReauthorizeAccountUrlOptions) =>
            getReauthorizeAccountUrl(props, sdkConfig),
        exchangeCodeForToken: (props: ExchangeCodeForTokenOptions) => exchangeCodeForToken(props, sdkConfig),
        pushData: (props: PushDataOptions) => pushData(props, sdkConfig),
        readSession: (props: ReadSessionOptions) => readSession(props, sdkConfig),
        deleteUser: (props: DeleteUserOptions) => deleteUser(props, sdkConfig),
        deleteAccount: (props: DeleteAccountOptions) => deleteAccount(props, sdkConfig),
        getRevokeAccountPermissionUrl: (props: GetRevokeAccountPermissionUrlOptions) =>
            getRevokeAccountPermissionUrl(props, sdkConfig),
        readFile: (props: ReadFileOptions) => readFile(props, sdkConfig),
        readFileList: (props: ReadFileListOptions) => readFileList(props, sdkConfig),
        readAllFiles: (props: ReadAllFilesOptions) => readAllFiles(props, sdkConfig),
        readAccounts: (props: ReadAccountsOptions) => readAccounts(props, sdkConfig),
        getPortabilityReport: (props: GetPortabilityReportOptions) => getPortabilityReport(props, sdkConfig),
        getServiceSampleDataSets: (props: GetServiceSampleDataSetsOptions) =>
            getServiceSampleDataSets(props, sdkConfig),
        refreshToken: (props: RefreshTokenOptions) => refreshToken(props, sdkConfig),
        querySources: (props: QuerySourcesOptions) => querySources(props, sdkConfig),
        queryCountries: (props: QueryCountriesOptions) => queryCountries(props, sdkConfig),
        queryPlatforms: (props: QueryPlatformsOptions) => queryPlatforms(props, sdkConfig),
        queryCategories: (props: QueryCategoriesOptions) => queryCategories(props, sdkConfig),
        createProvisionalStorage: (props: CreateProvisionalStorageOptions) =>
            createProvisionalStorage(props, sdkConfig),
        listStorageFiles: (props: ListStorageFilesOptions) => listStorageFiles(props, sdkConfig),
        downloadStorageFile: (props: DownloadStorageFileOptions) => downloadStorageFile(props, sdkConfig),
        deleteStorageFiles: (props: DeleteStorageFilesOptions) => deleteStorageFiles(props, sdkConfig),
        uploadFileToStorage: (props: UploadFileToStorageOptions) => uploadFileToStorage(props, sdkConfig),
        getUserStorage: (props: GetUserStorageOptions) => getUserStorage(props, sdkConfig),
    };
};

export { init };
