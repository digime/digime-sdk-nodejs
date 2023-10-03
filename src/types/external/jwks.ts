/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import z from "zod";

const JWKSKey = z.object({
    kid: z.string(),
    pem: z.string(),
});

export const JWKS = z.object({
    keys: z.array(JWKSKey),
});
