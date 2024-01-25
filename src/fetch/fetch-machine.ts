/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { createMachine, assign } from "xstate";
import { logFetchWrapper } from "../debug-log";
import type { DigiMeSdkError } from "../errors/errors";
import { DigiMeSdkApiError, DigiMeSdkTypeError } from "../errors/errors";
import { ApiErrorFromHeaders } from "../types/external/api-error-response";
import { abortableDelay } from "../abortable-delay";
import type { CalculateDelayOptions, RetryOptions } from "./retry";
import { DEFAULT_RETRY_OPTIONS, defaultCalculateDelay } from "./retry";
import { getRetryAfterDelay } from "./get-retry-after-delay";

/**
 * Fetch machine
 */
export const fetchMachine = createMachine(
    {
        /** @xstate-layout N4IgpgJg5mDOIC5QDMwBcDGALAsgQ2wEsA7MAOkIgBswBiAMQFEAVAYQAkBtABgF1FQABwD2sQmkLDiAkAA9EAWgBMAFgCsZAByaVATk1qAjEqXd1hgDQgAnomNkAbDpUqA7EdcHNupQF9fVqiYuARYJORBRMRQtBBS5CQAbsIA1hHo2PhR6cEkUAhJwhh4ElI8vOUyImKl0khyikq6rlqGXkqartyuAMymPVa2CB3cZD29SuNNDpMzav6BGSHZZJFh0bHxFMTJaatLWes5UfmFxbXlnIb89dXiknWg8gjKmg5k3Ny63yqGauq6QyuQaIHouMZqTRKBz-YyGFSfFQLEBrQ7hfa5DZgABO2OE2LIgioJWQ+IAthjMqF0Ws8gUdkUSg9LnwqqJ7lIZM81KNNGDDA4utwemoZtw-iCECp3rpupNtCoOr9pcjUdTSJT1jEcXiCUSSeTNWiNbTovTkudmXwrjchOzalzEG4ZXzdCLvEpDN0VJLpWRZa5VJogUpXDDvKqDuryAB3PD3aLMYQAJXQ2Osmw1hT2apWcYTUCTqbQ6fNjIu1tZt3tD0dCC9LVUKh63D5Xz6PSBkramg+gtlmlbbt0Dl08wCKKjefjEkTKbTGZ1+MJxLQpOxFNzRzI+dnhfnJesZctZUrtpAdwd9Weipa3BMTXcvShgMlfUMY2DThc8M8gZ6kbBMa5DYnAwhUIkYCprAIjELAYCMLi+KZgkDI5lO26gbA4GQdBsHwYhurHkyp4VFWdo1LW16NC0nSCl0npKGozSDmob4jmQbh6KoYbfD0MJIhOW7olhOFQXA+EIUh2IodsuzHMsmFgRB4kwVIBHScRFYVNcbKUZy1H1u8wqBoOX7qKYTi+roKicTyQI9D0I7MSKgFUisokqXh6lSbqtBLnqq7rpuGEicpuEST5hH4lpVpkeel5UU8iC9I4kyejChgjjZZiSpCvb9kYDi-OKTnjhOxDCBAcAyMJpB6RyjwNC8YIaMG7SdN0fTCpKCiGGCWj9jZ-WdN4-VuYp6KUDQDVXslLymEoZDuJ6riKrerYir1bhjENpWKgKxUTcBmp5LNSXNa8S2yhZrh-MK-zdjyfaeLKsrjD4kzHdGqzxjQEDnQZ80uO8Rh8k4gKAv0eXwo4YZrdwPJqGtBjfSsGDCGSRLoGAgNNdyYyOQi0Jg6o3zAjYiChi0Mwdvejl3dK46LEBP27nkRYLnjdb8RoPiuD4Y4GConRKN2Dg9C93jCj86iimjSnYV5kVwb5+Lc4Zyg2R8ahNJC8IzAJvr9f60qjsVyM6J4-j+EAA */
        schema: {
            context: {} as {
                request?: Request;
                attempts: number;
                retryOptions: RetryOptions;
                lastError?: unknown;
            },
            events: {} as { type: "FETCH"; request: Request; retryOptions?: Partial<RetryOptions> },
            services: {} as {
                delayRetry: { data: void };
                fetch: { data: Response };
                resolveResponseError: { data: { response: Response; error: DigiMeSdkError } };
            },
        },

        tsTypes: {} as import("./fetch-machine.typegen").Typegen0,
        predictableActionArguments: true,
        id: "fetchMachine",
        initial: "idle",

        context: {
            attempts: 0,
            lastError: new Error("TEMP: Default lastError"),
            retryOptions: DEFAULT_RETRY_OPTIONS,
        },

        states: {
            idle: {
                on: {
                    FETCH: {
                        target: "fetching",
                        actions: ["setRequest", "setRetryOptions"],
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

            setRetryOptions: assign({
                retryOptions: (context, event) => ({
                    ...DEFAULT_RETRY_OPTIONS,
                    ...event.retryOptions,
                }),
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
                return context.retryOptions.statusCodes.includes(event.data.response.status);
            },

            isRetryableError: (context, event) => context.retryOptions.isErrorRetryable(event.data),
        },

        services: {
            delayRetry: async (context, event) => {
                let retryAfter: number | undefined;

                if (event.type === "done.invoke.fetchMachine.resolveResponseError:invocation[0]") {
                    retryAfter = getRetryAfterDelay(event.data.response);
                }

                const calculatedDelayOptions: CalculateDelayOptions = {
                    retryOptions: context.retryOptions,
                    retryAfter,
                    attempts: context.attempts,
                    computedDelay: 0,
                    error: context.lastError,
                };

                calculatedDelayOptions.computedDelay = await defaultCalculateDelay(calculatedDelayOptions);

                const resolvedDelay =
                    (await context.retryOptions.calculateDelay?.(calculatedDelayOptions)) ??
                    calculatedDelayOptions.computedDelay;

                logFetchWrapper(
                    `[${context.request?.url}] Delaying attempt #${context.attempts + 1} for ${resolvedDelay}ms`,
                );

                await abortableDelay(resolvedDelay, context.request?.signal);

                return;
            },

            fetch: async (context) => {
                logFetchWrapper(
                    `[${context.request?.url}] Attempt: ${context.attempts}/${context.retryOptions.maxAttempts + 1}`,
                );

                // We're not using typestates, so we have to guard against this
                // See: https://xstate.js.org/docs/guides/typescript.html#typestates
                if (!context.request) {
                    throw new DigiMeSdkTypeError("No request in fetch machine!");
                }

                const response = await globalThis.fetch(context.request.clone());

                if (logFetchWrapper.enabled) {
                    const clonedResponse = response.clone();
                    const responseBody = await clonedResponse.text();
                    logFetchWrapper(
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
