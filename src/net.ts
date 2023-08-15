/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import got, { HTTPError } from "got";
import type { Got } from "got";
import { ServerError, SDKInvalidError } from "./errors";
import { isApiErrorResponse } from "./types/api/api-error-response";
import isString from "lodash.isstring";

export const net: Got = got;

export const handleServerResponse = (error: Error | unknown): void => {
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

    if (!isApiErrorResponse(body)) {
        return;
    }

    const { code, message } = body.error;

    if (code === "SDKInvalid" || code === "SDKVersionInvalid") {
        throw new SDKInvalidError(message, body.error);
    }

    throw new ServerError(message, body.error);
};

export const shouldThrowError = (error: Error | unknown): void => {
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
