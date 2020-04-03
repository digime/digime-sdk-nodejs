/*!
 * Copyright (c) 2009-2020 digi.me Limited. All rights reserved.
 */

import * as t from "io-ts";
import { codecAssertion, CodecAssertion } from "../../codec-assertion";

export interface ApiErrorResponse {
    error: {
        code: string,
        message: string,
    }
}

export const ApiErrorResponseCodec: t.Type<ApiErrorResponse> = t.type({
    error: t.type({
        code: t.string,
        message: t.string,
    }),
});

export const isApiErrorResponse = ApiErrorResponseCodec.is;

export const assertIsApiErrorResponse: CodecAssertion<ApiErrorResponse> = codecAssertion(ApiErrorResponseCodec);
