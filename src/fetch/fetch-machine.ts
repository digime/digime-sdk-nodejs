/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { createMachine, assign } from "xstate";
import { logFetch } from "../debug-log";
import { DigiMeSdkApiError, DigiMeSdkError, DigiMeSdkTypeError } from "../errors/errors";
import { ApiErrorFromHeaders } from "../types/external/api-error-response";
import { z } from "zod";

const ResolvedResponseError = z.object({
    response: z.instanceof(Response),
    error: z.instanceof(Error),
});

type ResolvedResponseError = z.infer<typeof ResolvedResponseError>;

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
        /** @xstate-layout N4IgpgJg5mDOIC5QDMwBcDGALAsgQ2wEsA7MAOkIgBswBiAMQFEAVAYQAkBtABgF1FQABwD2sQmkLDiAkAA9EAWgBMAZgCMZAGwqAHAE41Adk1KArABY1+gDQgAnoiU6ye7rpWm9m7kc1rzAL4BtqiYuARYJOShRMRQtBBS5CQAbsIA1tHo2PixWWEkUAipwhh4ElI8vFUyImIV0khyikp6hmQ6VqY6TobchipKbrYOCE7cZCoDqoatJiompkEh2eF5ZDGRcQlJFMRpmRuruVv5sUUlZQ1VnGr8TXXiko2g8gjKOppk3Nx6f5YWTxGEaIFTmcyTbpKTQWNRKfw-QLBECbE5RI4FbZgABO2OE2LIgio5WQ+IAthichF0ZtCsV9qVys8bnxaqInlIZG9TBMdGC1Jo+m5TCYfKYQQhzF9XLNdDpzE5LFLlijjtTSJStvEcXiCUSSeTNWiNbS4vS0ldmXxbvchOyGlzEOZjC4+XoPPp4f1zBKpS5+kpzJ1ZsZunoVaj1eQAO54J5xZjCABK6Gxdh2GpKh0j61j8agiZTaDT5sZ12trIe9uejoQan6ZED5hU3D5v0G6kMEqszm4gtcOlb7q8eiWyJzpzIeYkCeTqfTOvxhOJaFJ2IpE-R08KhfnpctlQrtpAjwdTTeCva3CUN7apgGPQMEsGGl0AvlSsMOllEbV62xcDCFQKRgCmsAiMQsBgIwuL4hmyQMtmf6TgBsBASBYEQVBMG6vuTKHtUlZ2vUNbni07TfoKfTwmYbSDuK9igl4ZDOuYeiBsYfwLBYv5hMa5CoehoFwFh0GwditCLnqK5rhuyHooJwHCeBUjYeJeHloRx6nqRryIAMWiqPCMJqCO5jcD6jEIN0zj9qYAqWD4KijrxVL-oBSmYapYm6vBewHGcawoR5GEid5OH4hpVrVHcbIkZyZF1l8bizIOnSaOYphDJoOi+noEKZT4AzOTC7pjsixDCBAcAyJupBxRyLzNO8YKmB0XQ9N+-SDMMVkKGoYIdP2OifEVX4mK5QXopQNANWeenvEMShkIYWVGAql6th4EoKM6kz9q4A0KgKGWTfxmqFHNunNR8y2uJlSiGGoPIeJZozPRMfZfq4rhTOxqhnVGGxxjQEBXQlC3gl89l8jlBgGEMKgSvZEKCoK5k8veQZjisfFAxgwhkkS6BgODTXcpMKhgteJk9GxbQSo97TzKo15U09Uo46qeO5nGM4FnOxajMRjW1txLiPexo46BY35KN22jfIK+huP8mUioD7loZ5YWQT5+Jk7Wyj5d8WXS-4Jgwm9ToDS4UqaF4mVfs6OhBEEQA */
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
                resolveResponseError: { data: ResolvedResponseError };
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
                        "resolveResponseError",
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

            resolveResponseError: {
                invoke: {
                    src: "resolveResponseError",
                    onDone: [
                        {
                            target: "waitingToRetry",
                            cond: "isResolvedErrorRetryable",
                            actions: "setLastErrorFromResolvedError",
                        },
                        {
                            target: "failed",
                            actions: "setLastErrorFromResolvedError",
                        },
                    ],
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

            setLastErrorFromResolvedError: assign({
                lastError: (context, event) => event.data.error,
            }),
        },

        guards: {
            isResponseOk: (context, event) => event.data.ok,

            isResolvedErrorRetryable: (context, event) => {
                return context.retryableStatusCodes.includes(event.data.response.status);
            },

            isRetryableError: (context, event) => isFetchNetworkError(event.data),
        },

        services: {
            delayRetry: async (context, event) => {
                if (context.attempts > context.maxAttempts) {
                    throw context.lastError;
                }

                // Introduce some delay noise to stagger parallel requests
                const noise = Math.round(Math.random() * 100);

                const dataParseResult = ResolvedResponseError.safeParse(event.data);

                const retryAfterDelay = dataParseResult.success
                    ? getRetryAfterDelay(dataParseResult.data.response)
                    : undefined;

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

            resolveResponseError: async (context, event) => {
                let resolvedError: Error;
                try {
                    resolvedError = new DigiMeSdkApiError(
                        ApiErrorFromHeaders.parse(Object.fromEntries(event.data.headers)),
                    );
                } catch (error) {
                    resolvedError = new DigiMeSdkTypeError(`Received unexpected error response from the Digi.me API`, {
                        cause: error,
                    });
                }

                return {
                    response: event.data,
                    error: resolvedError,
                };
            },
        },
    },
);
