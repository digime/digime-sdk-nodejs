/*!
 * © World Data Exchange. All rights reserved.
 */

import { sign } from "jsonwebtoken";
import { getRandomAlphaNumeric } from "./crypto";
import { handleServerResponse, net } from "./net";
import get from "lodash.get";
import { UserAccessToken } from "./types/user-access-token";
import { getPayloadFromToken } from "./utils/get-payload-from-token";
import { SDKConfiguration } from "./types/sdk-configuration";
import { ContractDetails } from "./types/common";
import { formatToken } from "./utils/format-token";

export interface RefreshTokenOptions {
    contractDetails: ContractDetails;
    userAccessToken: UserAccessToken;
}

const refreshToken = async (options: RefreshTokenOptions, sdkConfig: SDKConfiguration): Promise<UserAccessToken> => {
    const { contractDetails, userAccessToken } = options;
    const { contractId, privateKey } = contractDetails;

    const url = `${String(sdkConfig.baseUrl)}oauth/token`;

    try {
        const response = await net.post(url, {
            headers: {
                "Content-Type": "application/json",
            },
            responseType: "json",
            hooks: {
                beforeRequest: [
                    (options) => {
                        const jwt: string = sign(
                            {
                                client_id: `${sdkConfig.applicationId}_${contractId}`,
                                grant_type: "refresh_token",
                                nonce: getRandomAlphaNumeric(32),
                                refresh_token: userAccessToken.refreshToken.value,
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

        const payload = await getPayloadFromToken(get(response.body, "token"), sdkConfig);
        return formatToken(payload);
    } catch (error) {
        handleServerResponse(error);
        throw error;
    }
};

export { refreshToken };
