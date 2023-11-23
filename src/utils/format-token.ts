/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import get from "lodash.get";
import { UserAccessToken } from "../types/user-access-token";

const formatToken = async (token: unknown): Promise<UserAccessToken> => {
    return {
        accessToken: {
            value: get(token, ["access_token", "value"]),
            expiry: get(token, ["access_token", "expires_on"]),
        },
        refreshToken: {
            value: get(token, ["refresh_token", "value"]),
            expiry: get(token, ["refresh_token", "expires_on"]),
        },
        user: {
            id: get(token, ["sub"]),
        },
        consentid: get(token, ["consentid"]),
    };
};

export { formatToken };
