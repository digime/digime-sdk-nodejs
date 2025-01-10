/*!
 * © World Data Exchange. All rights reserved.
 */

import { sign } from "jsonwebtoken";
import NodeRSA from "node-rsa";
import { getRandomAlphaNumeric } from "./crypto";
import { net } from "./net";
import { assertIsCAFileListResponse, CAFileListResponse } from "./types/api/ca-file-list-response";
import { SDKConfiguration } from "./types/sdk-configuration";
import { UserAccessToken } from "./types/user-access-token";
import { refreshTokenWrapper } from "./utils/refresh-token-wrapper";
import { ContractDetails } from "./types/common";

interface ReadFileListOptions {
    sessionKey: string;
    contractId: string;
    privateKey: NodeRSA.Key;
    userAccessToken: UserAccessToken;
}

interface ReadFileListOptionsFormated {
    sessionKey: string;
    userAccessToken: UserAccessToken;
    contractDetails: ContractDetails;
}

const _readFileList = async (
    options: ReadFileListOptionsFormated,
    sdkConfig: SDKConfiguration
): Promise<CAFileListResponse> => {
    const url = `${String(sdkConfig.baseUrl)}permission-access/query/${options.sessionKey}`;
    const { userAccessToken } = options;
    const { contractId, privateKey } = options.contractDetails;

    const response = await net.get(url, {
        responseType: "json",
        retry: sdkConfig.retryOptions,
        hooks: {
            beforeRequest: [
                (options) => {
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
                    options.headers["Authorization"] = `Bearer ${jwt}`;
                },
            ],
        },
    });

    assertIsCAFileListResponse(response.body);

    return {
        ...response.body,
        userAccessToken,
    };
};

const readFileList = async (
    props: ReadFileListOptions,
    sdkConfiguration: SDKConfiguration
): Promise<CAFileListResponse> => {
    const formatedOptions: ReadFileListOptionsFormated = {
        sessionKey: props.sessionKey,
        userAccessToken: props.userAccessToken,
        contractDetails: {
            contractId: props.contractId,
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            privateKey: props.privateKey.toString(),
        },
    };
    return refreshTokenWrapper(_readFileList, formatedOptions, sdkConfiguration);
};

export { readFileList, ReadFileListOptions };

export { CAFileListResponse as ReadFileListResponse } from "./types/api/ca-file-list-response";
