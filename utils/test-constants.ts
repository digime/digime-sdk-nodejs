/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

export const TEST_BASE_URL = "https://api.digi.me/v1.7/";
export const TEST_ONBOARD_URL = "https://api.digi.me/apps/saas/";

export const TEST_CUSTOM_BASE_URL = "https://api.digi.test/v7/";
export const TEST_CUSTOM_ONBOARD_URL = "https://api.digi.test/saas/";

export const SAMPLE_TOKEN = {
    accessToken: {
        expiry: 1_000_000,
        value: "sample-token",
    },
    refreshToken: {
        expiry: 1_000_000,
        value: "sample-refresh-token",
    },
    user: {
        id: "test-user-id",
    },
    consentid: "test-consent-id",
};

export const BACKEND_FORMAT_SAMPLE_TOKEN = {
    access_token: {
        expires_on: 1_000_000,
        value: "sample-token",
    },
    refresh_token: {
        expires_on: 1_000_000,
        value: "sample-refresh-token",
    },
    sub: "test-user-id",
    consentid: "test-consent-id",
    identifier: {
        id: "app-scope-identifier",
    },
    token_type: "Bearer",
};
