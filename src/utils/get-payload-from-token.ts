/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import { decode, verify } from "jsonwebtoken";
import { JWTVerificationError } from "../errors";
import { isPlainObject } from "../utils";
import { net } from "../net";
import isString from "lodash.isstring";
import { isJWKS } from "../types/api/jwks";
import get from "lodash.get";
import { SDKConfiguration } from "../types/dme-sdk-configuration";

const getPayloadFromToken = async (token: string, options: SDKConfiguration): Promise<any> => {
    const decodedToken = decode(token, {complete: true});

    if (!isPlainObject(decodedToken)) {
        throw new JWTVerificationError("Unexpected JWT payload in token");
    }

    const jku: unknown = decodedToken?.header?.jku;
    const kid: unknown = decodedToken?.header?.kid;

    if (!isString(jku) || !isString(kid)) {
        throw new JWTVerificationError("Unexpected JWT payload in token");
    }

    const jkuResponse = await net.get(jku, {
        responseType: "json",
        retry: options.retryOptions,
    });

    if (!isJWKS(jkuResponse.body)) {
        throw new JWTVerificationError("Server returned non-JWKS response");
    }

    const pem = jkuResponse.body.keys.filter((key) => key.kid === kid).map((key) => key.pem);

    try {
        // NOTE: Casting to any as pem is unknown and this will throw anyway
        return verify(token, pem[0] as any, {algorithms: ["PS512"]});
    } catch (error) {
        throw new JWTVerificationError(get(error, "body.error.message"));
    }
};

export {
    getPayloadFromToken,
};
