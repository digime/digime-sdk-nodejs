/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import * as t from "io-ts";
import type { RetryFunction, RetryOptions as GotRetryOptions } from "got";
import { codecAssertion, CodecAssertion } from "../utils/codec-assertion";

// tslint:disable-next-line: no-empty-interface
export interface RetryOptions extends GotRetryOptions {}

const isRetryFunction = (u: unknown): u is RetryFunction => typeof u === "function";

const RetryFunctionCodec = new t.Type<RetryFunction>(
    "RetryFunctionCodec",
    isRetryFunction,
    (u, c) => (isRetryFunction(u) ? t.success(u) : t.failure(u, c)),
    t.identity
);

export const RetryOptionsCodec: t.Type<RetryOptions> = t.partial({
    retries: t.number,
    limit: t.number,
    methods: t.array(
        t.keyof({
            GET: null,
            POST: null,
            PUT: null,
            PATCH: null,
            HEAD: null,
            DELETE: null,
            OPTIONS: null,
            TRACE: null,
            get: null,
            post: null,
            put: null,
            patch: null,
            head: null,
            delete: null,
            options: null,
            trace: null,
        })
    ),
    statusCodes: t.array(t.number),
    errorCodes: t.array(t.string),
    calculateDelay: RetryFunctionCodec,
    maxRetryAfter: t.number,
});

export const isRetryOptions = RetryOptionsCodec.is;

export const assertIsRetryOptions: CodecAssertion<RetryOptions> = codecAssertion(RetryOptionsCodec);
