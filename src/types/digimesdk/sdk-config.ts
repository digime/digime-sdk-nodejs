/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";
import { TokenPair } from "../external/tokens";
import { ContractDetails } from "../contract-details";

// Transform and casting to have a more specific type for typechecking
const UrlWithTrailingSlash = z
    .string()
    .url()
    .endsWith("/")
    .transform((value) => value as `${string}/`);

/**
 * Input configuration options for Digi.me SDK
 */
export const SdkConfig = z.object(
    {
        /** Your customised application ID from digi.me */
        applicationId: z.string(),

        /**
         * ContractDetails, to set them right away without calling `sdk.setContractDetails()`
         * @defaultValue undefined
         */
        contractDetails: ContractDetails.optional(),

        /**
         * TokenPair, to set them right away without calling `sdk.setTokenPair()`
         * @defaultValue undefined
         */
        tokenPair: TokenPair.optional(),

        /**
         * Root URL for the digi.me API
         * Must end with a trailing slash
         * @defaultValue `"https://api.digi.me/v1.7/"`
         */
        baseURL: UrlWithTrailingSlash.optional(),

        /**
         * Root URL for the digi.me web onboard
         * Must end with a trailing slash
         * @defaultValue `"https://api.digi.me/apps/saas/"`
         */
        onboardURL: UrlWithTrailingSlash.optional(),

        /**
         * Callback to receive updated token after it updates automatically
         * @defaultValue undefined
         */
        onTokenPairRefreshed: z
            .function()
            .args(
                z.object({
                    /** The TokenPair that was automatically refreshed using the refresh token*/
                    outdatedTokenPair: TokenPair,
                    /** New TokenPair that replaced the outdated TokenPair. */
                    newTokenPair: TokenPair,
                }),
            )
            .returns(z.void())
            .optional(),
    },
    {
        required_error: "SdkConfig is required",
        invalid_type_error: "SdkConfig must be an object",
    },
);

export type SdkConfig = z.infer<typeof SdkConfig>;

/**
 * Internally stored configuration for Digi.me SDK
 */
export const StoredSdkConfig = SdkConfig.omit({ contractDetails: true, tokenPair: true }).required();

export type StoredSdkConfig = z.infer<typeof StoredSdkConfig>;
