/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair } from "jose";
import { randomUUID } from "node:crypto";
import { DEFAULT_BASE_URL } from "../digi-me-sdk/config";

const apiKeyPair = await generateKeyPair("PS512");
const apiPublicKeyJwk = await exportJWK(apiKeyPair.publicKey);
apiPublicKeyJwk.kid = randomUUID();

export const mockApiInternals = {
    ...apiKeyPair,
    publicKeyJwk: apiPublicKeyJwk,
    jwksKeyGetter: createLocalJWKSet({ keys: [apiPublicKeyJwk] }),

    /**
     * Signs a payload with the mock API credentials
     */
    signTokenPayload: async (payload: Record<string, unknown>) => {
        return new SignJWT(payload)
            .setProtectedHeader({
                alg: "PS512",
                typ: "JWT",
                jku: new URL("jwks/oauth", DEFAULT_BASE_URL).toString(),
                kid: mockApiInternals.publicKeyJwk.kid,
            })
            .sign(mockApiInternals.privateKey);
    },
} as const;
