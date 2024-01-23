/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { JWTVerifyGetKey, JWTVerifyOptions, jwtVerify } from "jose";
import { z } from "zod";
import { parseWithSchema } from "./zod/zod-parse";
import { DigiMeSdkError } from "./errors/errors";
import { TrustedJwks } from "./trusted-jwks";

/**
 * Utility function to get the JWKS from the JWT `jku` header
 */
export const jkuToJwks: JWTVerifyGetKey = (...args) => {
    const jku = args[0].jku;

    if (!jku) {
        throw new DigiMeSdkError("JKU is missing in the provided token");
    }

    const keyGetter = TrustedJwks.getJwksKeyResolverForUrl(jku);

    if (!keyGetter) {
        throw new DigiMeSdkError("TODO: JKU not in cache, explain");
    }

    return keyGetter(...args);
};

/**
 * Retrieve JKU verified payload from any given token
 */
export const getVerifiedTokenPayload = async <T extends z.ZodType<Record<string, unknown>>>(
    token: string | Uint8Array,
    payloadSchema?: T,
    options?: JWTVerifyOptions,
): Promise<z.infer<T>> => {
    const schema = payloadSchema ?? z.record(z.unknown());
    return parseWithSchema((await jwtVerify(token, jkuToJwks, options)).payload, schema);
};
