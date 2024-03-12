/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { logSendApiRequest } from "../debug-log";
import { isFetchNetworkError } from "./is-fetch-network-error";

type CalculateDelay = (options: CalculateDelayOptions) => Promise<number | undefined>;

export type RetryOptions = {
    /**
     * Maximum number of retries that are allowed before throwing the last error
     */
    maxAttempts: number;

    /**
     * If the `Retry-After` header is specified, this is the maximum duration `Retry-After` can have.
     * Otherwise, the Response is considered non-retryable.
     */
    maxRetryAfterDelay: number;

    /**
     * Response HTTP status codes that are considered retryable
     */
    statusCodes: readonly number[];

    /**
     * Function that determines if the error thrown by `fetch` is retryable
     */
    isErrorRetryable: (error: unknown) => boolean;

    /**
     * Function that calculates the amount of delay before a `Request` is retried
     */
    calculateDelay?: CalculateDelay;
};

export type CalculateDelayOptions = {
    /**
     * `retryOptions` passed into the fetch wrapper
     */
    retryOptions: RetryOptions;

    /**
     * Error that was eligible for a retry
     */
    error: unknown;

    /**
     * Amount of previous attempts at this Request
     */
    attempts: number;

    /**
     * Delay computed by the default delay calculation function
     */
    computedDelay: number;

    /**
     * Interpreted delay provided by the `Response`s `Retry-After` header, in milliseconds
     */
    retryAfter?: number | undefined;
};

export const defaultCalculateDelay = async ({
    attempts,
    retryAfter,
    retryOptions,
    error,
}: CalculateDelayOptions): Promise<number> => {
    // No attempts remaining
    if (attempts > retryOptions.maxAttempts) {
        logSendApiRequest(`Retry aborted, no attempts remaining`);
        throw error;
    }

    // In case "Retry-After" is too long, we should just fail
    if (retryAfter && retryAfter > retryOptions.maxRetryAfterDelay) {
        logSendApiRequest(
            `Retry aborted, encountered a retryable response but the "Retry-After" specified a delay over ${retryOptions.maxRetryAfterDelay}ms`,
        );
        throw error;
    }

    // Introduce some delay noise to stagger parallel requests
    const noise = Math.round(Math.random() * 100);

    return retryAfter ?? Math.pow(2, attempts - 2) * 1000 + noise;
};

export const DEFAULT_RETRY_OPTIONS = {
    maxAttempts: 3,
    maxRetryAfterDelay: 10000,
    statusCodes: [408, 429, 500, 502, 503, 504, 521, 522, 524],
    isErrorRetryable: isFetchNetworkError,
} satisfies RetryOptions;
