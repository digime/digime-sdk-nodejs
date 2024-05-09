/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import * as t from "io-ts";
import { codecAssertion, CodecAssertion } from "../../utils/codec-assertion";

export interface Session {
    expiry: number;
    key: string;
}

export const SessionCodec: t.Type<Session> = t.type({
    expiry: t.number,
    key: t.string,
});

export const isSession = SessionCodec.is;

export const assertIsSession: CodecAssertion<Session> = codecAssertion(SessionCodec);
