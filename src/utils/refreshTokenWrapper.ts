/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import { refreshToken } from "../authorisation";
import { SDKConfigProps } from "../sdk";
import { RefreshTokenOptions } from "../types";
import { UserAccessToken } from "../types/user-access-token";

export const refreshTokenWrapper = async <Args extends RefreshTokenOptions & SDKConfigProps, Return>(
    operation: (operationParameters: Args) => Return,
    prop: Args,
): Promise<Return> => {
    try {
        return await operation(prop);
    } catch (error) {
        if (error.response.statusCode !== 401) {
            throw(error);
        }
    }

    const newTokens: UserAccessToken = await refreshToken({
        userAccessToken: prop.userAccessToken,
        sdkConfig: prop.sdkConfig,
    });

    return await operation({
        ...prop,
        userAccessToken: newTokens,
    });
}
