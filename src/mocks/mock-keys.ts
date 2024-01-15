/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair } from "jose";
import { randomUUID } from "node:crypto";
import { signTokenPayload } from "../sign-token-payload";
import { DEFAULT_BASE_URL } from "../digi-me-sdk/config";

// Server keypair for testing
export const serverKeyPair = await generateKeyPair("PS512");

export const serverJWK = await exportJWK(serverKeyPair.publicKey);
serverJWK.kid = randomUUID();

export const serverJWKS = createLocalJWKSet({ keys: [serverJWK] });

// Client keypair for testing
export const clientKeyPair = await generateKeyPair("PS512");

/**
 * Signs a payload with the test server credentials
 */
export const serverSignTokenPayload = async (payload: Parameters<typeof signTokenPayload>[0]) => {
    return new SignJWT(payload)
        .setProtectedHeader({
            alg: "PS512",
            typ: "JWT",
            jku: new URL("jwks/oauth", DEFAULT_BASE_URL).toString(),
            kid: serverJWK.kid,
        })
        .sign(serverKeyPair.privateKey);
};
