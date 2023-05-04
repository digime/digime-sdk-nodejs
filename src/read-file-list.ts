/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { sign } from "jsonwebtoken";
import NodeRSA from "node-rsa";
import { getRandomAlphaNumeric } from "./crypto";
import { handleServerResponse, net } from "./net";
import { assertIsCAFileListResponse, CAFileListResponse } from "./types/api/ca-file-list-response";
import { SDKConfiguration } from "./types/sdk-configuration";
import { UserAccessToken } from "./types/user-access-token";
import { Response } from "got/dist/source";

interface ReadFileListOptions {
    sessionKey: string;
    contractId: string;
    privateKey: NodeRSA.Key;
    userAccessToken: UserAccessToken;
}

const readFileList = async (options: ReadFileListOptions, sdkConfig: SDKConfiguration): Promise<CAFileListResponse> => {
    const url = `${sdkConfig.baseUrl}permission-access/query/${options.sessionKey}`;
    const { contractId, privateKey, userAccessToken } = options;
    let response: Response<unknown>;
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
    try {
        response = await net.get(url, {
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
            responseType: "json",
            retry: sdkConfig.retryOptions,
        });
    } catch (error) {
        handleServerResponse(error);
        throw error;
    }

    assertIsCAFileListResponse(response.body);

    return response.body;
};

export { readFileList, ReadFileListOptions, CAFileListResponse as ReadFileListResponse };
