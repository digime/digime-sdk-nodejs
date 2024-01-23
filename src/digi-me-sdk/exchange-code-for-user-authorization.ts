/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";

/**
 * `<instance>.exchangeCodeForUserAuthorization()` input parameters
 */
export const ExchangeCodeForUserAuthorizationParameters = z.object({
    /** codeVerifier received as a result of `getAuthorizeUrl` call */
    codeVerifier: z.string(),

    /** authorizationCode received by the callback you provided to `getAuthorizeUrl` */
    authorizationCode: z.string(),

    /** AbortSignal to abort this operation */
    signal: z.instanceof(AbortSignal).optional(),
});

export type ExchangeCodeForUserAuthorizationParameters = z.infer<typeof ExchangeCodeForUserAuthorizationParameters>;
