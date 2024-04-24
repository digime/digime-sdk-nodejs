/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import * as t from "io-ts";
import { codecAssertion, CodecAssertion } from "../../utils/codec-assertion";

interface StorageApiError {
    error?: string;
    message?: string;
}

export interface ApiErrorResponse {
    error?: ApiError;
    message?: string;
}

export interface ApiError {
    code: string;
    message: string;
    statusMessage?: string;
    statusCode?: number;
}

export const ApiErrorCodec: t.Type<ApiError> = t.type({
    code: t.string,
    message: t.string,
});

export const StorageApiErrorCodec: t.Type<StorageApiError> = t.partial({
    error: t.string,
    message: t.string,
});

const ApiErrorResponseCodec: t.Type<ApiErrorResponse> = t.partial({
    error: ApiErrorCodec,
    message: t.string,
});

export const isStorageApiErrorCodec = StorageApiErrorCodec.is;

export const isApiErrorResponse = ApiErrorResponseCodec.is;

export const assertIsApiErrorResponse: CodecAssertion<ApiErrorResponse> = codecAssertion(ApiErrorResponseCodec);
