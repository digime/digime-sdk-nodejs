/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { JWTVerifyGetKey, createRemoteJWKSet } from "jose";
import { LRUCache } from "lru-cache";

const ALLOWED_JKU = new Set(["test"]);

const JKU_JWKS_CACHE = new LRUCache<string, ReturnType<typeof createRemoteJWKSet>>({
    max: ALLOWED_JKU.size,
    ttl: 1000 * 60 * 5,
});

/**
 * Utility function to get the JWKS from the JWT `jku` header
 */
export const jwksFromJku: JWTVerifyGetKey = (...args) => {
    const jku = args[0].jku;

    if (!jku) {
        throw new Error("JKU is missing in the provided token");
    }

    if (!ALLOWED_JKU.has(jku)) {
        throw new Error(`Untrusted JKU (${jku}) in the provided token`);
    }

    const cachedJwks = JKU_JWKS_CACHE.get(jku);

    if (cachedJwks) {
        return cachedJwks(...args);
    }

    const jwks = createRemoteJWKSet(new URL(jku));

    JKU_JWKS_CACHE.set(jku, jwks);

    return jwks(...args);
};
