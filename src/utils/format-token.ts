/*!
 * © World Data Exchange. All rights reserved.
 */

import get from "lodash.get";
import { UserAccessToken } from "../types/user-access-token";

const formatToken = (token: unknown): UserAccessToken => {
    return {
        accessToken: {
            value: get(token, ["access_token", "value"], ""),
            expiry: get(token, ["access_token", "expires_on"], 0),
        },
        refreshToken: {
            value: get(token, ["refresh_token", "value"], ""),
            expiry: get(token, ["refresh_token", "expires_on"], 0),
        },
        user: {
            id: get(token, ["sub"]),
        },
        consentid: get(token, ["consentid"]),
    };
};

export { formatToken };
