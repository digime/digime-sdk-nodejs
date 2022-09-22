/*!
 * Copyright (c) 2009-2022 digi.me Limited. All rights reserved.
 */

import * as t from "io-ts";
import { codecAssertion, CodecAssertion } from "../../utils/codec-assertion";

export interface ApiErrorResponse {
    error: ApiError;
}

export interface ApiError {
    code: string;
    message: string;
}

export const ApiErrorCodec: t.Type<ApiError> = t.type({
    code: t.string,
    message: t.string,
});

const ApiErrorResponseCodec: t.Type<ApiErrorResponse> = t.type({
    error: ApiErrorCodec,
});

export const isApiErrorResponse = ApiErrorResponseCodec.is;

export const assertIsApiErrorResponse: CodecAssertion<ApiErrorResponse> = codecAssertion(ApiErrorResponseCodec);
