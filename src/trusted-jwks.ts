/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import type { JWTVerifyGetKey } from "jose";
import { createRemoteJWKSet } from "jose";
import { LRUCache } from "lru-cache";
import { parseWithSchema } from "./zod/zod-parse";
import { DigiMeSdkError, DigiMeSdkTypeError } from "./errors/errors";
import { errorMessages } from "./errors/messages";
import { z } from "zod";
import { DEFAULT_BASE_URL } from "./constants";

export class TrustedJwks {
    static #defaultTrustedJwksUrl = new URL("jwks/oauth", DEFAULT_BASE_URL).toString();
    static #trustedJwksCache = new LRUCache<string, ReturnType<typeof createRemoteJWKSet>>({
        max: 10,
    });

    /**
     * Adds the URL as a trusted JWKS URL
     * - JWT verifications via JKU will fail if they reference an untrusted JWKS URL
     * - Default Digi.me OAuth JWKS URL is trusted by default, and it doesn't need to be manually added
     * - When a new `DigiMeSdk` instance is created, `<instance base url>/jwks/oauth` is automatically added as a trusted JWKS URL
     */
    static addUrlAsTrustedJwks(url: string): void {
        url = parseWithSchema(url, z.string().url(), "`url` argument");
        const jwks = createRemoteJWKSet(new URL(url), { headers: { Accept: "application/json" } });
        this.#trustedJwksCache.set(url, jwks);
    }

    /**
     * Retrieves a JWKS key resolver for a given URL.
     * - URL must be first added with the `TrustedJwks.addUrlAsTrustedJwks()` method
     */
    static getJwksKeyResolverForUrl(url: string): ReturnType<typeof createRemoteJWKSet> {
        url = parseWithSchema(url, z.string().url(), "`url` argument");

        // Add the default JWKS as the most common use case
        if (!this.#trustedJwksCache.has(this.#defaultTrustedJwksUrl)) {
            this.addUrlAsTrustedJwks(this.#defaultTrustedJwksUrl);
        }

        const jwks = this.#trustedJwksCache.get(url);

        if (!jwks) {
            throw new DigiMeSdkError(errorMessages.gettingUntrustedJwksKeyResolver);
        }

        return jwks;
    }

    /**
     * Utility function to get the JWKS from the JWT `jku` header
     */
    static jkuJwksKeyGetter: JWTVerifyGetKey = (...args) => {
        const jku = args[0].jku;

        if (!jku) {
            throw new DigiMeSdkTypeError("JKU is missing in the provided token");
        }

        return this.getJwksKeyResolverForUrl(jku)(...args);
    };
}
