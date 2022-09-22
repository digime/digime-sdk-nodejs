/*!
 * Copyright (c) 2009-2022 digi.me Limited. All rights reserved.
 */

import * as t from "io-ts";
import { codecAssertion, CodecAssertion } from "../../utils/codec-assertion";

export interface JWKS {
    keys: Record<string, unknown>[];
}

export const JWKSCodec: t.Type<JWKS> = t.type({
    keys: t.array(t.UnknownRecord),
});

export const isJWKS = JWKSCodec.is;

export const assertIsJWKS: CodecAssertion<JWKS> = codecAssertion(JWKSCodec);
