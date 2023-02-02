/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { CAAccountCodec, CAAccount } from "./ca-account";
import * as t from "io-ts";
import { codecAssertion, CodecAssertion } from "../../utils/codec-assertion";

export interface CAAccountsResponse {
    accounts: CAAccount[];
}

export const CAAccountsResponseCodec: t.Type<CAAccountsResponse> = t.type({
    accounts: t.array(CAAccountCodec),
});

export const isCAAccountsResponse = CAAccountsResponseCodec.is;

export const assertIsCAAccountsResponse: CodecAssertion<CAAccountsResponse> = codecAssertion(CAAccountsResponseCodec);
