/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";
import { UserAuthorization } from "../user-authorization";

/**
 * `<instance>.refreshUserAuthorization()` input parameters
 */
export const RefreshUserAuthorizationParameters = z.object({
    /** authorizationCode received by the callback you provided to `getAuthorizeUrl` */
    userAuthorization: z.instanceof(UserAuthorization),

    /** AbortSignal to abort this operation */
    signal: z.instanceof(AbortSignal).optional(),
});

export type RefreshUserAuthorizationParameters = z.infer<typeof RefreshUserAuthorizationParameters>;
