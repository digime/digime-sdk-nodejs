/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { SignJWT, exportJWK, generateKeyPair } from "jose";
import { randomUUID } from "node:crypto";
import { fromMockApiBase } from "./utilities";

const DAY_IN_SECONDS = 86400;

export const buildMockApiInternals = async (baseUrl?: string) => {
    const apiKeyPair = await generateKeyPair("PS512");
    const apiPublicKeyJwk = await exportJWK(apiKeyPair.publicKey);
    apiPublicKeyJwk.kid = randomUUID();

    /**
     * Signs a payload with the mock API credentials
     */
    const signTokenPayload = async (payload: Record<string, unknown>) => {
        return new SignJWT(payload)
            .setProtectedHeader({
                alg: "PS512",
                typ: "JWT",
                jku: fromMockApiBase("jwks/oauth", baseUrl),
                kid: apiPublicKeyJwk.kid,
            })
            .sign(apiKeyPair.privateKey);
    };

    const generateUserAuthorizationJwt = async () => {
        const uuid = randomUUID();
        return await signTokenPayload({
            access_token: {
                value: `mock-access-token-${uuid}`,
                // Random access token expires in a day
                expires_on: Date.now() * 1000 + DAY_IN_SECONDS,
            },
            refresh_token: {
                value: `mock-refresh-token-${uuid}`,
                // Random refresh token expires in a week
                expires_on: Date.now() * 1000 + DAY_IN_SECONDS * 7,
            },
            identifier: {
                id: `mock-identifier-id-${uuid}`,
            },
            consentid: `mock-consent-id-${uuid}`,
            sub: `mock-sub-${uuid}`,
            token_type: "Bearer",
        });
    };

    return {
        ...apiKeyPair,
        publicKeyJwk: apiPublicKeyJwk,
        signTokenPayload,
        generateUserAuthorizationJwt,
    } as const;
};

export const mockApiInternals = await buildMockApiInternals();
