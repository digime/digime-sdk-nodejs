/*!
 * © World Data Exchange. All rights reserved.
 */

import { formatToken } from "./format-token";
import { UserAccessToken } from "../types/user-access-token";
import { BACKEND_FORMAT_SAMPLE_TOKEN, SAMPLE_TOKEN } from "../../utils/test-constants";

describe("formatToken", () => {
    it("should correctly format a valid token", () => {
        const expected: UserAccessToken = {
            accessToken: {
                value: SAMPLE_TOKEN.accessToken.value,
                expiry: SAMPLE_TOKEN.accessToken.expiry,
            },
            refreshToken: {
                value: SAMPLE_TOKEN.refreshToken.value,
                expiry: SAMPLE_TOKEN.refreshToken.expiry,
            },
            user: {
                id: SAMPLE_TOKEN.user.id,
            },
            consentid: SAMPLE_TOKEN.consentid,
        };

        const result = formatToken(BACKEND_FORMAT_SAMPLE_TOKEN);
        expect(result).toEqual(expected);
    });

    it("should handle missing access and refresh token properties gracefully", () => {
        const token = {
            access_token: {},
            refresh_token: {},
            sub: "user-id-123",
        };

        const expected: UserAccessToken = {
            accessToken: {
                value: "",
                expiry: 0,
            },
            refreshToken: {
                value: "",
                expiry: 0,
            },
            user: {
                id: "user-id-123",
            },
            consentid: undefined,
        };

        const result = formatToken(token);
        expect(result).toEqual(expected);
    });

    it("should return default values for missing user properties", () => {
        const token = {};

        const expected: UserAccessToken = {
            accessToken: {
                value: "",
                expiry: 0,
            },
            refreshToken: {
                value: "",
                expiry: 0,
            },
            user: {
                id: undefined,
            },
            consentid: undefined,
        };

        const result = formatToken(token);
        expect(result).toEqual(expected);
    });
});
