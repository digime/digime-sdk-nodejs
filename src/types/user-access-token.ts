/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";

const Token = z.object({
    expiry: z.number(),
    value: z.string(),
});

export const UserAccessToken = z.object({
    accessToken: Token,
    refreshToken: Token,
});

export type UserAccessToken = z.infer<typeof UserAccessToken>;
