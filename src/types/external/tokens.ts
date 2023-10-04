/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";

export const Token = z.object({
    value: z.string(),
    expires_on: z.string(),
});

export type Token = z.infer<typeof Token>;

export const TokenPair = z.object({
    access_token: Token,
    refresh_token: Token,
});

export type TokenPair = z.infer<typeof TokenPair>;
