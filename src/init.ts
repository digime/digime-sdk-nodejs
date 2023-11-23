/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { pushData, PushDataOptions } from "./push";
import { assertIsSDKConfiguration, SDKConfiguration } from "./types/sdk-configuration";
import { getAvailableServices, GetAvailableServicesOptions } from "./get-available-services";
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
import { TypeValidationError } from "./errors";
import { DigimeSDK } from "./sdk";
import { getReauthorizeAccountUrl, GetReauthorizeAccountUrlOptions } from "./get-reauthorize-account-url";
import { getPortabilityReport, GetPortabilityReportOptions } from "./get-portability-report";
import { getServiceSampleDataSets, GetServiceSampleDataSetsOptions } from "./get-service-sample-datasets";

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
        getAvailableServices: (props: GetAvailableServicesOptions) => getAvailableServices(props, sdkConfig),
        readFile: (props: ReadFileOptions) => readFile(props, sdkConfig),
        readFileList: (props: ReadFileListOptions) => readFileList(props, sdkConfig),
        readAllFiles: (props: ReadAllFilesOptions) => readAllFiles(props, sdkConfig),
        readAccounts: (props: ReadAccountsOptions) => readAccounts(props, sdkConfig),
        getPortabilityReport: (props: GetPortabilityReportOptions) => getPortabilityReport(props, sdkConfig),
        getServiceSampleDataSets: (props: GetServiceSampleDataSetsOptions) =>
            getServiceSampleDataSets(props, sdkConfig),
    };
};

export { init };
