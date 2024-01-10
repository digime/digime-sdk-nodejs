/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";

export const DEFAULT_BASE_URL = "https://api.digi.me/v1.7/";
export const DEFAULT_ONBOARD_URL = "https://api.digi.me/apps/saas/";

// Transform and casting to have a more specific type for typechecking
const UrlWithTrailingSlash = z
    .string()
    .url()
    .endsWith("/")
    .transform((value) => value as `${string}/`);

/**
 * Input configuration options for Digi.me SDK
 */
export const DigiMeSdkConfig = z.object(
    {
        /** Your customised application ID from digi.me */
        applicationId: z.string(),

        /** The ID of the contract you intend to use */
        contractId: z.string(),

        /** Private key in PKCS1 format of the contract you intend to use */
        contractPrivateKey: z.string(),

        /**
         * Root URL for the digi.me API
         * Must end with a trailing slash
         * @defaultValue `"https://api.digi.me/v1.7/"`
         */
        baseUrl: UrlWithTrailingSlash.default(DEFAULT_BASE_URL),

        /**
         * Root URL for the digi.me web onboard
         * Must end with a trailing slash
         * @defaultValue `"https://api.digi.me/apps/saas/"`
         */
        onboardUrl: UrlWithTrailingSlash.default(DEFAULT_ONBOARD_URL),
    },
    {
        required_error: "SdkConfig is required",
        invalid_type_error: "SdkConfig must be an object",
    },
);

export type InputDigiMeSdkConfig = z.input<typeof DigiMeSdkConfig>;
export type DigiMeSdkConfig = z.infer<typeof DigiMeSdkConfig>;
