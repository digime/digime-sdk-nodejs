/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";

/**
 * Expected response from `/oauth/token`
 */
export const OauthTokenResponse = z.object({
    token: z.string(),
});

/**
 * Tokens contained within the `/oauth/token` JWT payload
 */
export const AccessOrRefreshToken = z
    .object({
        /**
         * TODO: DOcument
         */
        value: z.string(),

        /**
         * TODO: DOcument
         */
        expires_on: z.number(),
    })
    .passthrough();

export type AccessOrRefreshToken = z.infer<typeof AccessOrRefreshToken>;

/**
 * Expected payload of the JWT provided by `/oauth/token`
 */
export const OauthTokenPayload = z
    .object({
        /**
         * TODO: Document
         */
        access_token: AccessOrRefreshToken,

        /**
         * TODO: Document
         */
        refresh_token: AccessOrRefreshToken,

        /**
         * TODO: Document
         */
        sub: z.string().optional(),

        // Figure out if and how to expose these
        // consentid: z.string(),
        // identifier: z.object({
        //     id: z.string(),
        // }),
        // token_type: z.string(),
    })
    .passthrough();

export type OauthTokenPayload = z.infer<typeof OauthTokenPayload>;

/**
 * Legacy compatibility things
 */

/**
 * Legacy shape of the Access/Refresh token object
 */
export const LegacyAccessOrRefreshToken = z
    .object({
        /**
         * TODO: DOcument
         */
        value: z.string(),

        /**
         * TODO: DOcument
         */
        expiry: z.number(),
    })
    .passthrough();

export type LegacyAccessOrRefreshToken = z.infer<typeof LegacyAccessOrRefreshToken>;

/**
 * Legacy shape of the returned OAuth Token payload
 */
export const LegacyOauthTokenPayload = z
    .object({
        /**
         * TODO: DOcument
         */
        accessToken: LegacyAccessOrRefreshToken,

        /**
         * TODO: DOcument
         */
        refreshToken: LegacyAccessOrRefreshToken,

        /**
         * TODO: DOcument
         */
        user: z
            .object({
                id: z.string().optional(),
            })
            .passthrough()
            .optional(),

        /**
         * TODO: DOcument
         */
        consentid: z.string().optional(),
    })
    .passthrough();

export type LegacyOauthTokenPayload = z.infer<typeof LegacyOauthTokenPayload>;

export const fromLegacyOauthTokenPayload = (legacyPayload: LegacyOauthTokenPayload): OauthTokenPayload => {
    const {
        accessToken: { expiry: accessTokenExpiry, ...accessTokenRest },
        refreshToken: { expiry: refreshTokenExpiry, ...refreshTokenRest },
        user,
        ...payloadRest
    } = legacyPayload;

    const payload: OauthTokenPayload = {
        access_token: {
            expires_on: accessTokenExpiry,
            ...accessTokenRest,
        },
        refresh_token: {
            expires_on: refreshTokenExpiry,
            ...refreshTokenRest,
        },
        ...payloadRest,
    };

    if (user?.id) {
        payload.sub = user.id;
    }

    return payload;
};

export const toLegacyOauthTokenPayload = (payload: OauthTokenPayload): LegacyOauthTokenPayload => {
    const {
        access_token: { expires_on: accessTokenExpiresOn, ...accessTokenRest },
        refresh_token: { expires_on: refreshTokenExpiresOn, ...refreshTokenRest },
        sub,
        ...payloadRest
    } = payload;

    const legacyPayload: LegacyOauthTokenPayload = {
        accessToken: {
            expiry: accessTokenExpiresOn,
            ...accessTokenRest,
        },
        refreshToken: {
            expiry: refreshTokenExpiresOn,
            ...refreshTokenRest,
        },
        ...payloadRest,
    };

    if (sub) {
        legacyPayload.user = { id: sub };
    }

    return legacyPayload;
};
