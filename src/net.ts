/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import got, { HTTPError } from "got";
import type { Got } from "got";
import { ServerError, SDKInvalidError } from "./errors";
import { isApiErrorResponse, isStorageApiErrorCodec } from "./types/api/api-error-response";
import isString from "lodash.isstring";

export const net: Got = got;

export const handleServerResponse = (error: unknown): void => {
    if (!(error instanceof HTTPError)) {
        return;
    }

    let body: unknown = error.response.body;

    if (Buffer.isBuffer(body)) {
        body = body.toString("utf8");
    }

    // Attempt to parse body in case it's a string
    if (isString(body)) {
        try {
            body = JSON.parse(body);
        } catch {
            return;
        }
    }

    if (!isApiErrorResponse(body) && !isStorageApiErrorCodec(body)) {
        return;
    }

    let code: string | undefined = undefined;
    let message: string | undefined = undefined;
    let statusCode: number | undefined = undefined;
    let statusMessage: string | undefined = undefined;
    let reference: string | undefined = undefined;

    if (isString(body.error) || isString(body.message)) {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        code = body.error?.toString();
        message = body.message?.toString();
    } else {
        code = body.error?.code;
        message = body.error?.message;
        reference = body.error?.reference;
    }

    if (error.response.statusCode && error.response.statusMessage) {
        statusCode = error.response.statusCode;
        statusMessage = error.response.statusMessage.toString();
    }

    if (code === "SDKInvalid" || code === "SDKVersionInvalid") {
        throw new SDKInvalidError(message || "Invalid SDK version", {
            code,
            message: message || "Invalid SDK version",
            reference: reference || "Unknown reference",
            statusCode,
            statusMessage,
        });
    }

    throw new ServerError(message || "Server error", {
        code: code || "DigiMeServerError",
        message: message || "Server error",
        reference: reference || "Unknown reference",
        statusCode,
        statusMessage,
    });
};

export const shouldThrowError = (error: unknown): void => {
    if (!(error instanceof HTTPError)) {
        throw error;
    }

    if (error.response.statusCode !== 401) {
        handleServerResponse(error);
        throw error;
    }

    const body: unknown = error.response.body;

    if (isApiErrorResponse(body) && body.error.code !== "InvalidToken") {
        handleServerResponse(error);
        throw error;
    }
};
