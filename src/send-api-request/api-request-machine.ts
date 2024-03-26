/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { setup, assign, fromPromise } from "xstate";
import { logSendApiRequest } from "../debug-log";
import type { DigiMeSdkError } from "../errors/errors";
import { DigiMeSdkApiError, DigiMeSdkTypeError } from "../errors/errors";
import { ApiErrorFromHeaders } from "../schemas/api/api-error";
import { abortableDelay } from "../abortable-delay";
import type { CalculateDelayOptions, RetryOptions } from "./retry";
import { DEFAULT_RETRY_OPTIONS, defaultCalculateDelay } from "./retry";
import { getRetryAfterDelay } from "./get-retry-after-delay";
import { z } from "zod";

const OutputResponseSchema = z.object({
    output: z.instanceof(Response),
});

const OutputWithResponseAndErrorSchema = z.object({
    output: z.object({
        response: z.instanceof(Response),
        error: z.unknown(),
    }),
});

const EventWithErrorSchema = z.object({
    event: z.object({
        error: z.unknown(),
    }),
});

const EventOutputWithErrorSchema = z.object({
    event: z.object({
        output: z.object({
            error: z.unknown(),
        }),
    }),
});

export type RequestInitializer = () => Request | Promise<Request>;

export const getRequestLabel = (request: Request | undefined): string => {
    if (request instanceof Request) {
        return `${request.method} ${request.url}`;
    }

    return "UNKNOWN REQUEST";
};

const serializeRequestOrResponse = async (objectToSerialize: Request | Response): Promise<string> => {
    // Headers
    const headers = JSON.stringify(Object.fromEntries(objectToSerialize.headers.entries()), undefined, 2);

    // Body reading
    let textBody = await objectToSerialize.text();
    try {
        textBody = JSON.stringify(JSON.parse(textBody), undefined, 2);
    } catch {
        // Nothing to do here, body isn't JSON
    }

    const lines: string[] = [];

    if (objectToSerialize instanceof Response) {
        lines.push("==== STATUS =====", `${objectToSerialize.status} ${objectToSerialize.statusText}`);
    }

    lines.push("==== HEADERS ====", `${headers}`, "==== BODY =======", `${textBody}`, "=================");

    return lines.join("\n");
};
/**
 * API Request Machine
 */
export const apiRequestMachine = setup({
    types: {} as {
        input: {
            requestInitializer: RequestInitializer;
            retryOptions?: Partial<RetryOptions> | undefined;
        };
        events: { type: "START" };
        context: {
            requestInitializer: RequestInitializer;
            attempts: number;
            retryOptions: RetryOptions;
            request?: Request;

            lastError?: unknown;
        };
    },

    actions: {
        setRequest: assign({
            request: (_, request: Request) => request,
        }),

        incrementAttempts: assign({
            attempts: ({ context }) => context.attempts + 1,
        }),

        setLastError: assign({
            lastError: (_, error: unknown) => error,
        }),
    },

    guards: {
        isResponseOk: (_, response: Response) => {
            return response.ok;
        },
        isResolvedErrorRetryable: ({ context }, response: Response) => {
            return context.retryOptions.statusCodes.includes(response.status);
        },
        isRetryableError: ({ context }, error: unknown) => {
            return context.retryOptions.isErrorRetryable(error);
        },
    },

    actors: {
        createRequest: fromPromise(async ({ input }: { input: { requestInitializer: RequestInitializer } }) => {
            return await input.requestInitializer();
        }),

        fetch: fromPromise(
            async ({ input }: { input: { request: Request; attempts: number; maxAttempts: number } }) => {
                const { request, attempts, maxAttempts } = input;
                const requestLabel = getRequestLabel(request);
                logSendApiRequest(`[${requestLabel}] Attempt: ${attempts}/${maxAttempts + 1}`);

                if (logSendApiRequest.enabled) {
                    logSendApiRequest(
                        `[${requestLabel}] Making request:\n${await serializeRequestOrResponse(request.clone())}`,
                    );
                }

                const response = await globalThis.fetch(request);

                if (logSendApiRequest.enabled) {
                    logSendApiRequest(
                        `[${requestLabel}] Received response:\n${await serializeRequestOrResponse(response.clone())}`,
                    );
                }

                return response;
            },
        ),

        delayRetry: fromPromise(
            async ({
                input,
            }: {
                input: {
                    request?: Request;
                    response?: Response;
                    retryOptions: RetryOptions;
                    attempts: number;
                    lastError: unknown;
                };
            }) => {
                const { request, response, retryOptions, attempts, lastError } = input;
                let retryAfter: number | undefined;

                if (response) {
                    retryAfter = getRetryAfterDelay(response);
                }

                const calculatedDelayOptions: CalculateDelayOptions = {
                    retryOptions,
                    retryAfter,
                    attempts,
                    computedDelay: 0,
                    error: lastError,
                };

                calculatedDelayOptions.computedDelay = await defaultCalculateDelay(calculatedDelayOptions);

                const resolvedDelay =
                    (await retryOptions.calculateDelay?.(calculatedDelayOptions)) ??
                    calculatedDelayOptions.computedDelay;

                logSendApiRequest(
                    `[${getRequestLabel(request)}] Delaying attempt #${attempts + 1} for ${resolvedDelay}ms`,
                );

                await abortableDelay(resolvedDelay, request?.signal);

                return;
            },
        ),

        resolveResponseError: fromPromise(async ({ input }: { input: { response: Response } }) => {
            const { response } = input;
            let resolvedError: DigiMeSdkError;
            try {
                resolvedError = new DigiMeSdkApiError(ApiErrorFromHeaders.parse(Object.fromEntries(response.headers)));
            } catch (error) {
                resolvedError = new DigiMeSdkTypeError(`Received unexpected error response from the Digi.me API`, {
                    cause: error,
                });
            }

            return {
                response,
                error: resolvedError,
            };
        }),
        // resolveResponseError: () => {},
        // createRequest: () => {},
    },
}).createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QEMAOBLASmAjgVzgBcBZZAYwAt0A7MAOnQgBswBiAZQBUBBTTgbQAMAXUShUAe1jpC6CdTEgAHogC0AJk10A7AEYAbABZdggKz6AHOtO7dAGhABPRBd10L209cGX1gwYZWAL5BDmhYuASwJORUtHRkAE5gyLLUUNj4RKwQ8vQ0AG4SANb04ZlRMZQ09EkpaRmRRAiFEmSpctRCwt2KktKy8ooqCBp67qYAnKaC6rqT2pOaFg7OCADMhtp0gtqG+uuT6+oWk5O2IWEYFUSk1fEAZmCE91A5eQzURaV05U3Rdzi9CeLziUBaXzaHXk3V6SBA-RknWGanWtjo+kWFlmi1M6wCpm0q0Q+nU6x0pxMRish3OlxAfyyANiNToINe73irR+jMqgNZ7LBEKK7UGXRE-F0onhiLFKNG6jO7j0ZKm+kmmN0FnWxIQlm2hlMhlm+MNmgW9N5txZj2eHLAiUSEkSdFQTFSD2dAFtftd-lUgWy7ULWqLOrCRH0pEihvCRqptOT9F5dKYLISAvpbLrAuTtAF9oELFZLKZLX6mQGBcGaG8HU6XW6Pd7fRFK-zbaDa8KoWLYVKowNkXHENZ1DtBBYDhrtHN1sWVk5ELmdAXqcX1KXy22+Tb6MlYBImAUwNhYJJqLAwABRR3Ozn5SE8iu7+77uBHk9ni9X28NnthjCEqRjK0ZyiOCC6NsNj+FB2pznM6i6toRgYtiRgmLo6zYYY6zbjczJvnQB6fqecA-jed6JA+nzfGUL7WkRJHHmR57yL+VEAdC4o9AOoFDrGoAjFmdCGGSZzmNMiyTLMupToYdAnGihqYgWZj4f6HbvoeLHfuxlENqw9bOq67qEJ6iQ+lahGBsxX7kfpf7OlxfbAdK4hgcOQlqIqeb4qYUy6IERwGPouqTFsGKCNMPgyYq6iGhp7Z7nQADuyBIuknASNghCJI4NHcvRO6MYG6WZVA2W5flLnhm5g4xgoEGqOs+gYhJ5g2FmexIUuCBzKYOhatoVgodM6xpklr5lRlDRVc8+VGVRpnNpZrYEVW8TlXNOULY4tVAT0IEeQJTXeQghqDRqSyGMa2EmIqurzOOPXWJiWyLCcIShCA1ASBAcCKNZm1gA14HnS1UwYliOLjQSRJ9Qm5KpihhiTKcPgeMEP3A1pDDMKD-GNfKGjomYZK4UsggTYcOp9UFdCbGSlgavOtOBFNpWsnUHTpBtYNecoPkajoybaKjVhTksT3i0NxbUxF8UGBYnM2dWXbpALglCwq4ybtdKFprMmJhX1gRuNF6yeCcWzFiheE4wxavxHZrEUU5iRa2dOstbsdDnGJ1PpvsU502sKHjmLcxGGiQX6Poqsg2ls21vNeVrCdxMQVhkx0LYeILJuVuaLovVrPMghy-BBjmOTZaOyVzvAhlLAQF78pbIN+x4tT5iFqSckWApMwapi+vHLsid42QEhem6zyE5n4M+yY-v6LsMyY148eErqpIW4cD1mONRjfUEQA */
    // schema: {
    //     // context: {} as {
    //     //     requestInitializer?: RequestInitializer;
    //     //     request?: Request;
    //     //     attempts: number;
    //     //     retryOptions: RetryOptions;
    //     //     lastError?: unknown;
    //     // },
    //     // events: {} as {
    //     //     type: "START";
    //     //     requestInitializer: RequestInitializer;
    //     //     retryOptions?: Partial<RetryOptions>;
    //     // },
    //     // services: {} as {
    //     //     delayRetry: { data: void };
    //     //     fetch: { data: Response };
    //     //     resolveResponseError: { data: { response: Response; error: DigiMeSdkError } };
    //     //     createRequest: { data: Request };
    //     // },
    // },

    // tsTypes: {} as import("./api-request-machine.typegen").Typegen0,
    // predictableActionArguments: true,
    id: "apiRequestMachine",

    context: ({ input }) => ({
        attempts: 0,
        lastError: new Error("TEMP: Default lastError"),
        // TODO: Fix deep merging
        retryOptions: { ...DEFAULT_RETRY_OPTIONS, ...input.retryOptions },
        requestInitializer: input.requestInitializer,
    }),

    initial: "idle",

    output: ({ event }) => {
        return event.output;
    },

    states: {
        idle: {
            on: {
                START: {
                    target: "creatingRequest",
                },
            },
        },

        creatingRequest: {
            invoke: {
                src: "createRequest",
                input: ({ context }) => ({ requestInitializer: context.requestInitializer }),

                onDone: {
                    target: "fetching",
                    actions: [{ type: "setRequest", params: ({ event }) => event.output }],
                },
            },

            entry: "incrementAttempts",
        },

        fetching: {
            invoke: {
                src: "fetch",
                input: ({ context }) => {
                    if (!context.request) {
                        throw new Error("TEMP: No request");
                    }

                    return {
                        request: context.request,
                        attempts: context.attempts,
                        maxAttempts: context.retryOptions.maxAttempts,
                    };
                },

                onError: [
                    {
                        target: "waitingToRetry",

                        guard: {
                            type: "isRetryableError",
                            params: (params: unknown) => {
                                return EventWithErrorSchema.parse(params).event.error;
                            },
                        },
                        actions: [
                            {
                                type: "setLastError",
                                params: (params: unknown) => {
                                    const result = EventWithErrorSchema.parse(params);
                                    return result.event.error;
                                },
                            },
                        ],
                    },
                    {
                        target: "failed",
                        actions: [
                            {
                                type: "setLastError",
                                params: (params: unknown) => {
                                    const result = EventWithErrorSchema.parse(params);
                                    return result.event.error;
                                },
                            },
                        ],
                    },
                ],

                onDone: [
                    {
                        target: "complete",
                        guard: { type: "isResponseOk", params: ({ event }) => event.output },
                    },
                    {
                        target: "resolveResponseError",
                    },
                ],
            },
        },

        resolveResponseError: {
            invoke: {
                src: "resolveResponseError",
                input: ({ event }) => {
                    return { response: OutputResponseSchema.parse(event).output };
                },
                onDone: [
                    {
                        target: "waitingToRetry",
                        guard: {
                            type: "isResolvedErrorRetryable",
                            params: ({ event }) => event.output.response,
                        },

                        actions: [
                            {
                                type: "setLastError",
                                params: (params: unknown) => {
                                    const result = EventOutputWithErrorSchema.parse(params);
                                    return result.event.output.error;
                                },
                            },
                        ],
                    },
                    {
                        target: "failed",
                        actions: [
                            {
                                type: "setLastError",
                                params: (params: unknown) => {
                                    const result = EventOutputWithErrorSchema.parse(params);
                                    return result.event.output.error;
                                },
                            },
                        ],
                    },
                ],
                onError: {
                    target: "failed",
                    actions: [
                        {
                            type: "setLastError",
                            params: (params: unknown) => {
                                const result = EventWithErrorSchema.parse(params);
                                return result.event.error;
                            },
                        },
                    ],
                },
            },
        },

        waitingToRetry: {
            invoke: {
                src: "delayRetry",
                input: ({ context, event }) => {
                    let response;
                    const parsedEvent = OutputWithResponseAndErrorSchema.safeParse(event);
                    if (parsedEvent.success) {
                        response = parsedEvent.data.output.response;
                    }

                    return {
                        request: context.request,
                        response: response,
                        retryOptions: context.retryOptions,
                        attempts: context.attempts,
                        lastError: context.lastError,
                    };
                },

                onDone: "creatingRequest",
                onError: {
                    target: "failed",
                    actions: [
                        {
                            type: "setLastError",
                            params: (params: unknown) => {
                                const result = EventWithErrorSchema.parse(params);
                                return result.event.error;
                            },
                        },
                    ],
                },
            },
        },

        failed: {
            type: "final",
            output: ({ context }) => {
                return context.lastError;
            },
        },

        complete: {
            type: "final",
            output: ({ event }) => {
                const result = OutputResponseSchema.parse(event);
                return result.output;
            },
        },
    },
});
