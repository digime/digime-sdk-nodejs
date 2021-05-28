import { refreshToken } from "../authorisation";
import { InternalProps } from "../sdk";
import { RefreshTokenOptions } from "../types";
import { UserAccessToken } from "../types/user-access-token";

export const refreshTokenWrapper = async <Args extends RefreshTokenOptions & InternalProps, Return>(
    operation: (operationParameters: Args) => Return,
    prop: Args
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
        userAccessToken: newTokens
    });
}
