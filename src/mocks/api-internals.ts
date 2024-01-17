/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { SignJWT, exportJWK, generateKeyPair } from "jose";
import { randomUUID } from "node:crypto";
import { fromMockApiBase } from "./utilities";

export const buildMockApiInternals = async (baseUrl?: string) => {
    const apiKeyPair = await generateKeyPair("PS512");
    const apiPublicKeyJwk = await exportJWK(apiKeyPair.publicKey);
    apiPublicKeyJwk.kid = randomUUID();

    return {
        ...apiKeyPair,
        publicKeyJwk: apiPublicKeyJwk,

        /**
         * Signs a payload with the mock API credentials
         */
        signTokenPayload: async (payload: Record<string, unknown>) => {
            return new SignJWT(payload)
                .setProtectedHeader({
                    alg: "PS512",
                    typ: "JWT",
                    jku: fromMockApiBase("jwks/oauth", baseUrl),
                    kid: apiPublicKeyJwk.kid,
                })
                .sign(apiKeyPair.privateKey);
        },
    } as const;
};

export const mockApiInternals = await buildMockApiInternals();
