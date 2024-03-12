/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

const fetchNetworkErrorMessages = new Set([
    "Failed to fetch", // MSW or Chromium based
    "fetch failed", // Node.js (Undici)
]);

/**
 * Detects if an error thrown by fetch is a network error
 *
 * NOTE: Only accounts for Node.js Undici, MSW and Chromium based implementation errors
 * Add handling for other implementations if needed
 */
export const isFetchNetworkError = (value: unknown): boolean => {
    return Boolean(value && value instanceof TypeError && fetchNetworkErrorMessages.has(value.message));
};
