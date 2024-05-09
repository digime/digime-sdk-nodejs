/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import * as t from "io-ts";
import { CodecAssertion, codecAssertion } from "../../utils/codec-assertion";

export interface CAAccount extends Record<string, unknown> {}

export const CAAccountCodec: t.Type<CAAccount> = t.UnknownRecord;

export const isCAAccount = CAAccountCodec.is;

export const assertIsCAAccount: CodecAssertion<CAAccount> = codecAssertion(CAAccountCodec);
