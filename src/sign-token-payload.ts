/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { JWTHeaderParameters, SignJWT } from "jose";
import { createPrivateKey } from "node:crypto";
import { DigiMeSdkTypeError } from "./errors/errors";

/**
 * Signs a payload with some recurring default parameters
 */
export const signTokenPayload = (
    payload: Record<string, unknown>,
    secret: Parameters<typeof createPrivateKey>[0],
    headerParameters?: JWTHeaderParameters,
): Promise<string> => {
    if (!secret) {
        throw new DigiMeSdkTypeError("No secret provided");
    }

    return new SignJWT(payload)
        .setProtectedHeader({ alg: "PS512", typ: "JWT", ...headerParameters })
        .sign(createPrivateKey(secret), {});
};
