/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { JOSEError, JWKSTimeout } from "jose/errors";
import { abortableDelay } from "../../src/abortable-delay";

/**
 * NOTE: This is a replica of `jose`'s internal fetchJwks function. It's used as a mock in the tests.
 * See `vitest.setup.ts` for more details.
 */
export const fetchJwks = async (
    url: URL,
    timeout: number | undefined,
    options: { headers?: Record<string, string> } = {},
) => {
    if (!["https:", "http:"].includes(url.protocol)) {
        throw new TypeError("Unsupported URL protocol.");
    }

    const request = fetch(url.href, {
        headers: options.headers,
    });

    const response = await Promise.race([request, abortableDelay(timeout ?? 10000)]);

    if (!response) throw new JWKSTimeout();
    if (response.status !== 200) throw new JOSEError("Expected 200 OK from the JSON Web Key Set HTTP response");

    try {
        return await response.json();
    } catch {
        throw new JOSEError("Failed to parse the JSON Web Key Set HTTP response as JSON");
    }
};
