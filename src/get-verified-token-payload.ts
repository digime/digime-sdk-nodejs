/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { JWTVerifyOptions, jwtVerify } from "jose";
import { z } from "zod";
import { parseWithSchema } from "./zod/zod-parse";
import { TrustedJwks } from "./trusted-jwks";

/**
 * Retrieve JKU verified payload from any given token
 */
export const getVerifiedTokenPayload = async <T extends z.ZodType<Record<string, unknown>>>(
    token: string | Uint8Array,
    payloadSchema?: T,
    options?: JWTVerifyOptions,
): Promise<z.infer<T>> => {
    const schema = payloadSchema ?? z.record(z.unknown());
    return parseWithSchema((await jwtVerify(token, TrustedJwks.jkuJwksKeyGetter, options)).payload, schema);
};
