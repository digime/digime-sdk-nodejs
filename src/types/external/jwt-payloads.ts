/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import z from "zod";

const Token = z.object({
    value: z.string(),
    expires_on: z.string(),
});

export const PayloadPreauthorizationCode = z.object({
    preauthorization_code: z.string(),
});

export type PayloadPreauthorizationCode = z.infer<typeof PayloadPreauthorizationCode>;

export const PayloadAccessAndRefreshTokens = z.object({
    access_token: Token,
    refresh_token: Token,
});

export type PayloadAccessAndRefreshTokens = z.infer<typeof PayloadAccessAndRefreshTokens>;
