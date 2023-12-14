/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { createMachine, assign } from "xstate";
import { logFetch } from "../debug-log";
import { DigiMeSdkApiError, DigiMeSdkError, DigiMeSdkTypeError } from "../errors/errors";
import { ApiErrorFromHeaders } from "../types/external/api-error-response";

const RETRY_DEFAULTS = {
    maxAttempts: 3,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504, 521, 522, 524],
};

const abortableDelay = (milliseconds: number, signal?: AbortSignal): Promise<void> => {
    const delayPromises = [new Promise<void>((resolve) => setTimeout(resolve, milliseconds))];

    if (signal) {
        delayPromises.push(
            new Promise<void>((_, reject) => {
                signal.addEventListener(
                    "abort",
                    () => {
                        try {
                            signal.throwIfAborted();
                        } catch (e) {
                            reject(e);
                        }
                    },
                    { once: true, signal: AbortSignal.timeout(milliseconds + 1) },
                );
            }),
        );
    }

    return Promise.race(delayPromises);
};

const getRetryAfterDelay = (response: Response): number | undefined => {
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

/**
 * NOTE: Only accounts for Node.js Undici implementation errors
 * Add handling for other implementations if needed
 */
const fetchNetworkErrorMessages = new Set([
    "Failed to fetch", // MSW
    "fetch failed", // Node.js (Undici)
]);

const isFetchNetworkError = (value: unknown): boolean => {
    return Boolean(value && value instanceof TypeError && fetchNetworkErrorMessages.has(value.message));
};

export const fetchMachine = createMachine(
    {
        /** @xstate-layout N4IgpgJg5mDOIC5QDMwBcDGALAsgQ2wEsA7MAOkIgBswBiAMQFEAVAYQAkBtABgF1FQABwD2sQmkLDiAkAA9EAWgBMAZgCMZAGwqAHAE41Adk1KArABY1+gDQgAnoiU6ye7rpWm9m7kc1rzAL4BtqiYuARYJOShRMRQtBBS5CQAbsIA1tHo2PixWWEkUAipwhh4ElI8vFUyImIV0khyikp6hmQ6VqY6TobchipKbrYOCE7cZCoDqoatJiompkEh2eF5ZDGRcQlJFMRpmRuruVv5sUUlZQ1VnGr8TXXiko2g8ggKKp9khmrq3J06FTcTSGHSmEaIT7tUymPyGcyg1Qg7TLECbE5RI4FbaJUh7A5nNanLHnYr7UrlZ43JT3ISiJ5SGRvZQ6TRkbjcPRcwygoGaMGGCEIFRcrS+AxqUwDNRDQLBNHHCKYzaFWhgABO6uE6rIgio5WQ2oAtiSicrVoUyWkrlS+DUHvSGkzEKYJoDLCCOR4-FyhWo2XolLMdMCdOZLEDDKj0Uq8SrthqtTq9QbjaaMXGLXErRTrna7rVHc9nQhLEoyDLjIZTEpWvDYUKgWRzG4w6Z-JpNJ42kt5TH1gB3PBPOLMYQAJXQ6rsOzxJUO-eJQ5HUDHk7Q05zNsqdr4hfqxaab0l5Z8pg8YfMSl+UvB9kQVmcwNBbT0YP6V+jisHw4ko4nU4zom2q6vqaCGuqJqLpiy5-quAEbnYW6Uju1R7g6B6MkekLeC4nQLNwV6eEM8JCuMkzTEMUxTC2xhfmEGbkOqcDCFQKRgIwmrapOsAiMQsB0LiyTkgu37EsxsCsexnFJjxfECcheZobSICPE62HCqYLiGAYPStl4waNj0kxKNooIWGo-zqPROSxkxLFsRxXHqnJUgCWqzmgamkHpnZZASVJTmyXA8lgIptrKfuDIvM0wpspoCL+kCPjmIC-xCu25jfCGFhTNwTjdkE8rEMIEBwDI0GkFF6mvIougaD8fwAny5lCgovxZayOmst6XhqDZZpztQYDVYetXvEM5bVte8JKFefSAneowKAikwglyPgqFe-oJQNjGmoUo1YeNLLlq45g1j8roeOYfquuyIL6Jybg6bWKh7X5yDDjQEBHTFby6BMCLwiYeipYGehTI2XgdMiYacgi50fesGDCEaeroCNGHRSWWmfFt+VdlYc3cmRPJaKoqj5VCHa9isDF+bBhRroBf0loMejNrWmheAYIpBiofraA9OkcsY3hejoyPiQ50nOa5-FY3SmH-S0YPsjWXgItwNY6HrQrmH4WiciTetgi2vZBEAA */
        schema: {
            context: {} as {
                request?: Request;
                attempts: number;
                maxAttempts: number;
                maxRetryAfterDelay: number;
                retryableStatusCodes: number[];
                lastError?: unknown;
            },
            events: {} as { type: "FETCH"; request: Request },
            services: {} as {
                delayRetry: { data: void };
                fetch: { data: Response };
                resolveErrorResponse: { data: DigiMeSdkApiError };
            },
        },

        tsTypes: {} as import("./fetch-machine.typegen").Typegen0,
        predictableActionArguments: true,
        id: "fetchMachine",
        initial: "idle",

        context: {
            attempts: 0,
            maxAttempts: RETRY_DEFAULTS.maxAttempts,
            maxRetryAfterDelay: 10000,
            retryableStatusCodes: RETRY_DEFAULTS.retryableStatusCodes,
            lastError: new Error("TEMP: Default lastError"),
        },

        states: {
            idle: {
                on: {
                    FETCH: {
                        target: "fetching",
                        actions: "setRequest",
                    },
                },
            },

            fetching: {
                invoke: {
                    src: "fetch",

                    onError: [
                        {
                            target: "waitingToRetry",
                            cond: "isRetryableError",
                            actions: ["setLastError"],
                        },
                        {
                            target: "failed",
                            actions: ["setLastError"],
                        },
                    ],

                    onDone: [
                        {
                            target: "complete",
                            cond: "isResponseOk",
                        },
                        {
                            target: "waitingToRetry",
                            cond: "isResponseRetryable",
                        },
                        "resolveErrorResponse",
                    ],
                },

                entry: "incrementAttempts",
            },

            failed: {
                type: "final",
                data: (context) => {
                    return context.lastError;
                },
            },

            complete: {
                type: "final",

                data: (context, event) => {
                    return event.request;
                },
            },

            waitingToRetry: {
                invoke: {
                    src: "delayRetry",
                    onDone: "fetching",
                    onError: {
                        target: "failed",
                        actions: "setLastError",
                    },
                },
            },

            resolveErrorResponse: {
                invoke: {
                    src: "resolveErrorResponse",
                    onDone: {
                        target: "failed",
                        actions: "setLastError",
                    },
                    onError: {
                        target: "failed",
                        actions: "setLastError",
                    },
                },
            },
        },
    },
    {
        actions: {
            setRequest: assign({
                request: (context, event) => event.request,
            }),

            incrementAttempts: assign({
                attempts: (context) => context.attempts + 1,
            }),

            setLastError: assign({
                lastError: (context, event) => event.data,
            }),
        },

        guards: {
            isResponseOk: (context, event) => event.data.ok,

            isResponseRetryable: (context, event) => {
                return context.retryableStatusCodes.includes(event.data.status);
            },

            isRetryableError: (context, event) => isFetchNetworkError(event.data),
        },

        services: {
            delayRetry: async (context, event) => {
                if (context.attempts > context.maxAttempts) {
                    throw context.lastError;
                    // throw new DigiMeSdkError(`Fetch aborted, out of retry attempts`, { cause: context.lastError });
                }

                // Introduce some delay noise to stagger parallel requests
                const noise = Math.round(Math.random() * 100);

                // TODO: "Retry-After" delay clamping? Reject when detecting long retry-after?
                const retryAfterDelay = event.data instanceof Response ? getRetryAfterDelay(event.data) : undefined;

                // In case "Retry-After" is too long, we should just fail
                if (retryAfterDelay && retryAfterDelay > context.maxRetryAfterDelay) {
                    throw new DigiMeSdkError(
                        `Encountered a retryable response, but the "Retry-After" specified a delay over ${context.maxRetryAfterDelay}ms`,
                    );
                }

                // TODO: Custom Backoff functions?
                const calculatedDelay = Math.pow(2, context.attempts - 2) * 1000 + noise;

                const resolvedDelay = retryAfterDelay || calculatedDelay;
                logFetch(`[${context.request?.url}] Delaying attempt #${context.attempts + 1} for ${resolvedDelay}ms`);

                await abortableDelay(resolvedDelay, context.request?.signal);

                return;
            },

            fetch: async (context) => {
                logFetch(`[${context.request?.url}] Attempt: ${context.attempts}/${context.maxAttempts}`);

                // We're not using typestates, so we have to guard against this
                // See: https://xstate.js.org/docs/guides/typescript.html#typestates
                if (!context.request) {
                    throw new DigiMeSdkTypeError("No request in fetch machine!");
                }

                const response = await globalThis.fetch(context.request.clone());

                if (logFetch.enabled) {
                    const clonedResponse = response.clone();
                    const responseBody = await clonedResponse.text();
                    logFetch(
                        `[${context.request?.url}] Received response:\n====\n${clonedResponse.status} ${clonedResponse.statusText}\n----\n${responseBody}\n====`,
                    );
                }

                return response;
            },

            resolveErrorResponse: async (context, event) => {
                try {
                    const error = ApiErrorFromHeaders.parse(Object.fromEntries(event.data.headers));
                    return new DigiMeSdkApiError(error);
                } catch (error) {
                    throw new DigiMeSdkTypeError(`Received unexpected response from the Digi.me API`, {
                        cause: error,
                    });
                }
            },
        },
    },
);
