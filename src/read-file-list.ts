/*!
 * Copyright (c) 2009-2022 digi.me Limited. All rights reserved.
 */

import { sign } from "jsonwebtoken";
import NodeRSA from "node-rsa";
import { getRandomAlphaNumeric } from "./crypto";
import { net } from "./net";
import { assertIsCAFileListResponse, CAFileListResponse } from "./types/api/ca-file-list-response";
import { SDKConfiguration } from "./types/sdk-configuration";
import { UserAccessToken } from "./types/user-access-token";

interface ReadFileListOptions {
    sessionKey: string;
    contractId: string;
    privateKey: NodeRSA.Key;
    userAccessToken: UserAccessToken;
}

const readFileList = async (options: ReadFileListOptions, sdkConfig: SDKConfiguration): Promise<CAFileListResponse> => {
    const url = `${sdkConfig.baseUrl}permission-access/query/${options.sessionKey}`;
    const { contractId, privateKey, userAccessToken } = options;

    const jwt: string = sign(
        {
            access_token: userAccessToken.accessToken.value,
            client_id: `${sdkConfig.applicationId}_${contractId}`,
            nonce: getRandomAlphaNumeric(32),
            timestamp: Date.now(),
        },
        privateKey.toString(),
        {
            algorithm: "PS512",
            noTimestamp: true,
        }
    );
    const response = await net.get(url, {
        headers: {
            Authorization: `Bearer ${jwt}`,
        },
        responseType: "json",
        retry: sdkConfig.retryOptions,
    });

    assertIsCAFileListResponse(response.body);

    return response.body;
};

export { readFileList, ReadFileListOptions, CAFileListResponse as ReadFileListResponse };
