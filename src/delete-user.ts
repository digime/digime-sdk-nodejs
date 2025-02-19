/*!
 * © World Data Exchange. All rights reserved.
 */

import { getRandomAlphaNumeric } from "./crypto";
import { sign } from "jsonwebtoken";
import { net, handleServerResponse } from "./net";
import { UserAccessToken } from "./types/user-access-token";
import { SDKConfiguration } from "./types/sdk-configuration";
import { ContractDetails } from "./types/common";
import { Response } from "got";

export interface DeleteUserOptions {
    contractDetails: ContractDetails;
    userAccessToken: UserAccessToken;
}

export interface DeleteUserResponse {
    deleted: boolean;
    response: Response;
}

const deleteUser = async (options: DeleteUserOptions, sdkConfig: SDKConfiguration): Promise<DeleteUserResponse> => {
    const { userAccessToken, contractDetails } = options;
    const { contractId, privateKey } = contractDetails;

    const url = `${String(sdkConfig.baseUrl)}user`;

    try {
        const response = await net.delete(url, {
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
            responseType: "json",
        });

        return {
            deleted: true,
            response,
        };
    } catch (error) {
        handleServerResponse(error);
        throw error;
    }
};

export { deleteUser };
