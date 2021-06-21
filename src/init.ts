/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import { write, WriteOptions } from "./write";
import { SDKConfiguration } from "./types/sdk-configuration";
import { getAvailableServices } from "./get-available-services";
import { getAuthorizeUrl, GetAuthorizeUrlOptions } from "./get-authorize-url";
import { getOnboardServiceUrl, GetOnboardServiceUrlOptions } from "./get-onboard-service-url";
import { addTrailingSlash } from "./utils/basic-utils";
import { exchangeCodeForToken, ExchangeCodeForTokenOptions } from "./exchange-code-for-token";
import { readSession, ReadSessionOptions } from "./read-session";
import { readFile, ReadFileOptions } from "./read-file";
import { readFileList, ReadFileListOptions } from "./read-file-list";
import { readAllFiles, ReadAllFilesOptions } from "./read-all-files";
import { readAccounts, ReadAccountsOptions } from "./read-accounts";
import { deleteUser, DeleteUserOptions } from "./delete-user";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const init = (config: SDKConfiguration): any => {
    const formatted: SDKConfiguration = {
        ...config,
        baseUrl: addTrailingSlash(config.baseUrl),
        onboardUrl: addTrailingSlash(config.onboardUrl),
    };

    const sdkConfig: SDKConfiguration = {
        baseUrl: "https://api.digi.me/v1.6/",
        onboardUrl: "https://api.digi.me/apps/saas/",
        retryOptions: {
            retries: 5,
        },
        ...formatted,
    };

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
