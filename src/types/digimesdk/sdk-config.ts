/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";

/**
 * Configuration options for Digi.me SDK
 */
export const SdkConfig = z.object({
    /** Your customised application ID from digi.me */
    applicationId: z.string(),

    /** The ID of the contract you'd like to use */
    // contractId: z.string(),

    /** Private key in PKCS1 format */
    // privateKey: z.string(),

    /** Access token pair */
    // tokenPair: TokenPair.optional(),

    /**
     * Root URL for the digi.me API
     * @defaultValue `"https://api.digi.me/v1.7/"`
     */
    baseURL: z.string().optional(),

    /**
     * Root URL for the digi.me web onboard
     * @defaultValue `"https://api.digi.me/apps/saas/"`
     */
    onboardURL: z.string().optional(),

    /**
     * Callback to receive updated token after it updates automatically
     */
    onTokenRefreshed: z.function().returns(z.void()).optional(),
});

export type SdkConfig = z.infer<typeof SdkConfig>;
