/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";

export const ApiError = z.object({
    code: z.string(),
    message: z.string(),
    reference: z.string(),
});

export type ApiError = z.infer<typeof ApiError>;

export const ApiErrorResponse = z.object({
    error: ApiError,
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponse>;

export const ApiErrorHeaders = z.object({
    "x-error-code": z.string(),
    "x-error-message": z.string(),
    "x-error-reference": z.string(),
});

export type ApiErrorHeaders = z.infer<typeof ApiErrorHeaders>;

export const ApiErrorFromResponse = ApiErrorResponse.transform((value) => value.error);

export const ApiErrorFromHeaders = ApiErrorHeaders.transform(
    (value) =>
        ({
            code: value["x-error-code"],
            message: value["x-error-message"],
            reference: value["x-error-reference"],
        }) as ApiError,
);
