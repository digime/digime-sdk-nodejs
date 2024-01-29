/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { HttpResponse } from "msw";
import { formatBodyError, formatHeadersError } from "./utilities";
import { jwtVerify } from "jose";
import { mockSdkConsumerCredentials } from "./sdk-consumer-credentials";

/**
 * Mimics the way Digi.me API handles the request with an invalid JSON Accept header
 */
export const assertAcceptsJson = (request: Request): void => {
    const accept = request.headers.get("Accept");

    if (accept !== "application/json") {
        const error = { code: "ValidationErrors", message: "Parameter validation errors" };
        throw HttpResponse.json(formatBodyError(error), { status: 406, headers: formatHeadersError(error) });
    }
};

/**
 * Mimics the way Digi.me API handles the request with an invalid octet-stream Accept header
 * TODO: Confirm
 */
export const assertAcceptsOctetStream = (request: Request): void => {
    const accept = request.headers.get("Accept");

    if (accept !== "application/octet-stream") {
        const error = { code: "ValidationErrors", message: "Parameter validation errors" };
        throw HttpResponse.json(formatBodyError(error), { status: 406, headers: formatHeadersError(error) });
    }
};

/**
 * Mimics the way Digi.me API handles the request with an invalid JSON Content-Type header
 */
export const assertContentTypeJson = (request: Request): void => {
    const accept = request.headers.get("Content-Type");

    if (accept !== "application/json") {
        const error = { code: "ValidationErrors", message: "Parameter validation errors" };
        throw HttpResponse.json(formatBodyError(error), { status: 406, headers: formatHeadersError(error) });
    }
};

/**
 * Mimics the way Digi.me API handles the request with an invalid Authorization header
 */
export const assertBearerToken = async (request: Request): Promise<void> => {
    const authorization = request.headers.get("Authorization");
    const error = { code: "ValidationErrors", message: "Parameter validation errors" };
    const bodyError = formatBodyError(error);
    const headersError = formatHeadersError(error);

    if (!authorization) {
        throw HttpResponse.json(bodyError, { status: 406, headers: headersError });
    }

    const [type, token] = authorization.split(" ");

    if (!type || !token) {
        throw HttpResponse.json(bodyError, { status: 406, headers: headersError });
    }

    // Verify signature
    try {
        await jwtVerify(token, mockSdkConsumerCredentials.publicKey);
    } catch (e) {
        throw HttpResponse.json(bodyError, { status: 406, headers: headersError });
    }
};
