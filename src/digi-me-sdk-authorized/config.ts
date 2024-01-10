/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";
import { DigiMeSdk } from "../digi-me-sdk/digi-me-sdk";
import { UserAuthorization } from "../user-authorization";

/**
 * Input configuration options for Digi.me SDK
 */
export const DigiMeSdkAuthorizedConfig = z.object(
    {
        /** Instance of DigiMeSdk */
        digiMeSdkInstance: z.instanceof(DigiMeSdk),

        /**
         * TODO
         */
        userAuthorization: z.instanceof(UserAuthorization),

        /**
         * Callback that will provide new UserAuthorization if the ones provided are automatically updated by
         * the SDK.
         *
         * TODO: Correct function types
         */
        onUserAuthorizationUpdated: z.function().optional(),
    },
    {
        required_error: "DigiMeSdkAuthorized config is required",
        invalid_type_error: "DigiMeSdkAuthorized config must be an object",
    },
);

export type DigiMeSdkAuthorizedConfig = z.infer<typeof DigiMeSdkAuthorizedConfig>;
