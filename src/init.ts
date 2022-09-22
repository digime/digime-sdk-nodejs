/*!
 * Copyright (c) 2009-2022 digi.me Limited. All rights reserved.
 */

import { write, WriteOptions } from "./write";
import { assertIsSDKConfiguration, SDKConfiguration } from "./types/sdk-configuration";
import { getAvailableServices } from "./get-available-services";
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

const DEFAULT_BASE_URL = "https://api.digi.me/v1.6/";
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
        exchangeCodeForToken: (props: ExchangeCodeForTokenOptions) => exchangeCodeForToken(props, sdkConfig),
        write: (props: WriteOptions) => write(props, sdkConfig),
        readSession: (props: ReadSessionOptions) => readSession(props, sdkConfig),
        deleteUser: (props: DeleteUserOptions) => deleteUser(props, sdkConfig),
        getAvailableServices: (contractId?: string) => getAvailableServices(sdkConfig, contractId),
        readFile: (props: ReadFileOptions) => readFile(props, sdkConfig),
        readFileList: (props: ReadFileListOptions) => readFileList(props, sdkConfig),
        readAllFiles: (props: ReadAllFilesOptions) => readAllFiles(props, sdkConfig),
        readAccounts: (props: ReadAccountsOptions) => readAccounts(props, sdkConfig),
    };
};

export { init };
