/*!
 * Copyright (c) 2009-2022 digi.me Limited. All rights reserved.
 */

import { net } from "./net";
import { assertIsCAFileListResponse, CAFileListResponse } from "./types/api/ca-file-list-response";
import { SDKConfiguration } from "./types/sdk-configuration";

interface ReadFileListOptions {
    sessionKey: string;
}

const readFileList = async (options: ReadFileListOptions, sdkConfig: SDKConfiguration): Promise<CAFileListResponse> => {
    const url = `${sdkConfig.baseUrl}permission-access/query/${options.sessionKey}`;
    const response = await net.get(url, {
        responseType: "json",
        retry: sdkConfig.retryOptions,
    });

    assertIsCAFileListResponse(response.body);

    return response.body;
};

export { readFileList, ReadFileListOptions, CAFileListResponse as ReadFileListResponse };
