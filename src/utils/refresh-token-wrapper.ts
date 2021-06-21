/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import { refreshToken, RefreshTokenOptions } from "../refresh-token";
import { SDKConfiguration } from "../types/sdk-configuration";
import { UserAccessToken } from "../types/user-access-token";

export const refreshTokenWrapper = async <Args extends RefreshTokenOptions, Return>(
    operation: (operationParameters: Args, sdkConfiguration: SDKConfiguration) => Return,
    prop: Args,
    sdkConfiguration: SDKConfiguration
): Promise<Return> => {
    try {
        return await operation(prop, sdkConfiguration);
    } catch (error) {
        if (error.response.statusCode !== 401) {
            throw error;
        }
    }

    const newTokens: UserAccessToken = await refreshToken(
        {
            contractDetails: prop.contractDetails,
            userAccessToken: prop.userAccessToken,
        },
        sdkConfiguration
    );

    return await operation(
        {
            ...prop,
            userAccessToken: newTokens,
        },
        sdkConfiguration
    );
};
