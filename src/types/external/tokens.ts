/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";

export const Token = z.object({
    value: z.string(),
    expires_on: z.number(),
});

export type Token = z.infer<typeof Token>;

export const TokenPair = z.object({
    access_token: Token,
    refresh_token: Token,
    // consentid: z.string(),
    // identifier: z.object({
    //     id: z.string(),
    // }),
    // token_type: z.string(),
});

export type TokenPair = z.infer<typeof TokenPair>;
