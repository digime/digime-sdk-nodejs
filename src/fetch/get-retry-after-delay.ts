/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

/**
 * Takes a response and returns a duration of milliseconds of how long the `Retry-After` header is.
 * If the `Retry-After` header is in a date format, the reference for the duration is `Date.now()`.
 */
export const getRetryAfterDelay = (response: Response): number | undefined => {
    const retryAfter = response.headers.get("Retry-After");

    // No Retry-After header
    if (!retryAfter) {
        return undefined;
    }

    // Attempt to parse the seconds delay from the header
    const delaySeconds = Number(retryAfter);

    // If the delay is specified as a number in seconds, return in milliseconds
    if (!Number.isNaN(delaySeconds)) {
        return delaySeconds * 1000;
    }

    // Attempt to parse the date delay from the header
    const delayEpochTime = Date.parse(retryAfter);

    // if the delay is a millisecond timestamp, subtract current time from it
    if (!Number.isNaN(delayEpochTime)) {
        return delayEpochTime - Date.now();
    }

    // We couldn't parse the Retry-After header
    return undefined;
};
