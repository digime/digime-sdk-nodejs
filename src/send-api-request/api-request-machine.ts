/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { createMachine, assign } from "xstate";
import { logSendApiRequest } from "../debug-log";
import type { DigiMeSdkError } from "../errors/errors";
import { DigiMeSdkApiError, DigiMeSdkTypeError } from "../errors/errors";
import { ApiErrorFromHeaders } from "../schemas/api/api-error";
import { abortableDelay } from "../abortable-delay";
import type { CalculateDelayOptions, RetryOptions } from "./retry";
import { DEFAULT_RETRY_OPTIONS, defaultCalculateDelay } from "./retry";
import { getRetryAfterDelay } from "./get-retry-after-delay";

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
export const apiRequestMachine = createMachine(
    {
        /** @xstate-layout N4IgpgJg5mDOIC5QEMAOBLASmAjgVzgBcBZZAYwAt0A7MAOnQgBswBiAZQBUBBTTgbQAMAXUShUAe1jpC6CdTEgAHogC0AJgBsAdjoBGAKyaAzNqMBOPevXnNAFgA0IAJ6IAHHU1ujgvXcHGlnbGggYAvmFOaFi4BLAk5FS0dABmYISUNFCsEPL0NABuEgDW9NHY+ESkmclpGUlQCIUSZMiy8kLCnYqS0u0KSMpqxnp6ntrmboLqEwYhdgbaTq4ImurGdNpuloL2buvmlhFRGBVxCTX0dTXZucnNpXTlsVWJNFfpN03URa39nfw9KJBr0ZHIBqAVAgNIc6G5tFZjAZbLYEW5jMtEF5dAt-OtBAtrOZtMcQM9KvFqkkPvUsqwwAAnBkSBl0VBMNopFkAWyepxelLetU+DW+vza4IBIh6UjB8kUUNU5g2ekExL0E20xmM+22mIQdnRmwJdlN2i1qtNmlJ5POVPeqRFdMZzNZ7M5PL5MQpF2pjtp1EazT+kpEgOB4ll-QViHUBnUdEEgjcJlR6j0Orcbn1ho22hNeyzWm8Nv5PvtyQA7sgwYHOBJsIQGc4cnkGD8SmUy3ahfRq7WoPXG82xS0JR0w9KQVHwTHocZNJ5DgYjAY9JoNXZ1Pr0wZNnp4fttJpzHMDG5S96e5c6P3ZHWG+lm-SmSy2RzCFyGbzba8b3esiHJ9nFHEMJy6KdIz6WdBihBY9xRdRTQCEZpnMfU9HMBNtC3OMdDsc0sIvSIyW7P8-QZOAJCYAowGwWBJGoWAwAAUVfBlW3uDtHl-QUb0o2BqNo+jGOYtjXVA8dqClCMQFBaNYMQDU6DXJMNXRdNjHTbcXEQY87E8KZ7FVDNtWCS8znIh0BKEui4FE1j2M4-JuK7K8rOSGyaLshj5DE9jJP+MMgRlaD5UU1Yxi3QJTxPRZDmmfUUwM9R0T8Ix82Q8ISN431rKo7yRL8xzXRfV13w9b8vUsviKIK4T7OK8SWUC0MINk+SYMhNQbDzEIVyCbYRk0TR9XMAjPDVAxdnMNCkOyk53Nqh0yEoiVAxqwhnPbIoeLI5bklWsB1qgTbWvA7ppzCiEhmhGYxm8U9pkwiZrGzXSEGMCbBBw1MtO2Sw9AiEjqAkCA4EUXKKzAUK5RuxUkXMcZJmmWZ5kWfVVD8DxFjNBFlS1eNiMWzboYYZgYauuG5w0ddPAzU0Vz8TQBoMTGN0THCCLsQxTENU0LIFPLhQDKBYYU7q7qMOg7C8WacIPCY3EcD7DTGLxVXUXxZssLwFtIpbhauGsWAgcWutugi91luYAiMWXZZ0lYswM6bbB0LRlS1kkcv2o26DICRuXZdJKag6mIqxwQ6FsH7pt2bwtBZpYPrWMYAh2LXkTmexBfLXtbxre9B0fJsVnDiXbozJHRjmYktFMawrAw2b9yzLT1x8eN9ahguvIa3ymJKllzfCyXVBCXQgi1nUDFllMMQ+48E2T9N7BGZnrV9w2yaOk7NtH+GetsTZk-03UTydpTzTbqZAi3LD12IiIgA */
        schema: {
            context: {} as {
                requestInitializer?: RequestInitializer;
                request?: Request;
                attempts: number;
                retryOptions: RetryOptions;
                lastError?: unknown;
            },
            events: {} as {
                type: "START";
                requestInitializer: RequestInitializer;
                retryOptions?: Partial<RetryOptions>;
            },
            services: {} as {
                delayRetry: { data: void };
                fetch: { data: Response };
                resolveResponseError: { data: { response: Response; error: DigiMeSdkError } };
                createRequest: { data: Request };
            },
        },

        tsTypes: {} as import("./api-request-machine.typegen").Typegen0,
        predictableActionArguments: true,
        id: "apiRequestMachine",
        initial: "idle",

        context: {
            attempts: 0,
            lastError: new Error("TEMP: Default lastError"),
            retryOptions: DEFAULT_RETRY_OPTIONS,
        },

        states: {
            idle: {
                on: {
                    START: {
                        target: "creatingRequest",
                        actions: ["setRetryOptions", "setRequestCreator"],
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
                            actions: "setLastError",
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
                    return event.requestInitializer;
                },
            },

            waitingToRetry: {
                invoke: {
                    src: "delayRetry",
                    onDone: "creatingRequest",
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

            creatingRequest: {
                invoke: {
                    src: "createRequest",

                    onDone: {
                        target: "fetching",
                        actions: "setRequest",
                    },
                },

                entry: "incrementAttempts",
            },
        },
    },
    {
        actions: {
            setRequest: assign({
                request: (context, event) => event.data,
            }),

            setRequestCreator: assign({
                requestInitializer: (context, event) => event.requestInitializer,
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
            createRequest: async (context) => {
                if (!context.requestInitializer) {
                    throw new Error("TODO");
                }

                return await context.requestInitializer();
            },

            delayRetry: async (context, event) => {
                let retryAfter: number | undefined;

                if (event.type === "done.invoke.apiRequestMachine.resolveResponseError:invocation[0]") {
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

                logSendApiRequest(
                    `[${getRequestLabel(context.request)}] Delaying attempt #${context.attempts + 1} for ${resolvedDelay}ms`,
                );

                await abortableDelay(resolvedDelay, context.request?.signal);

                return;
            },

            fetch: async (context, event) => {
                const request = event.data;
                const requestLabel = getRequestLabel(request);
                logSendApiRequest(
                    `[${requestLabel}] Attempt: ${context.attempts}/${context.retryOptions.maxAttempts + 1}`,
                );

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
