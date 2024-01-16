/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { HttpResponse } from "msw";
import { formatBodyError, formatHeadersError } from "./utilities";

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
