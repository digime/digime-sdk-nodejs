/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { createMachine, assign } from "xstate";
import { ApiErrorResponse } from "../types/external/api-error-response";
import { ErrorWithCauseCode } from "../types/error-with-cause-code";
import { logFetch } from "../debug-log";

const RETRY_DEFAULTS = {
    maxAttempts: 3,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504, 521, 522, 524],
    retryableErrorCodes: ["ENOTFOUND", "ENETUNREACH", "EAI_AGAIN", "ECONNREFUSED", "ECONNRESET"],
};

// TODO: Handle aborts in other parts of the machine
export const fetchMachine = createMachine(
    {
        /** @xstate-layout N4IgpgJg5mDOIC5QDMwBcDGALAsgQ2wEsA7MAOkIgBswBiAMQFEAVAYQAkBtABgF1FQABwD2sQmkLDiAkAA9EAWgBMAZgCMZAGwqAHDoCcAdkNK1Sw-v0qANCACeiJTrL7uugCwBWA-rXcDOoYAvkG2qJi4BFgk5OFExFC0EFLkJABuwgDWsejY+PE5ESRQCOnCGHgSUjy8NTIiYlXSSHKKphqGOqqe3K76Bir6nrYOCE7cZCqGKkpK7txq0-4qmiFhuZEFZHHRCUkpFMQZ2dsb+buF8SVlFU01nGr8LQ3iks2g8gjKniqTmu5TCyGNQqAGeQwjRAqUFkHr6LxqTw-My6NYgHbnGKnIp7ZKkQ7HS6bC7Yq6lI7lSpve5KJ5CUSvKQyT7KbieMjcdzuPwqbj+QzcTRqdyQhAAzRkHSaTxGQzuIZInTuNEYqJYnbFWhgABO2uE2rIgiolWQ+oAtqTieqNsVyRlbtS+HVngymszFOCtNxDJo5iClL5tDphvYoRN5h59KpdNofkoVWc1fiNXsdXqDUaTebLZjkzaEnbKXcnY96q63u6xistEYFlMlJp+r5RbyyBHAv05Zp-ppOQmIrnyNq4MIqGlioxdfqAEpwETEWB0NP6w3GtCm7UW1VbYewUfjhKT9Oz2DzxeFh3VJ18MuNCstT5mdncyyaYHyzzd-SaUU-CZqbt1E6YNgX7PIkyHEcxwnKdtRPM86DxVIKRObcSV3fcYOPOcpHPG4qSvWobxdO8mQfRQ1HhWEFl6NQAOBAN9FFbt2TlTx5S5JEvBCUIQGIYQIDgGQ0JiW9GXeVovl5DQVgBYwjBBcVRQUEFflUTQdAAxsgWheNeJE-FKBoMS3XIr4lG4JQyEMTxTDlOZzGWENRgULxrJWTSnBUJEAO8MCrTzHEoBM+8Pgo79JQ0gN3B9GK33hUVEQmQULAsnRLLrfzB22PBCBoCAQrIsKxW82FP0U18LO0X8ekmKNXAs2Y-GDLKILIDDoMPWD4NwsBCoklk0o5ei-G0dRoRs39uS0SiuU5fpaNWfTEy2DBhDNI10D6kjxMrPxDGs1w2URPR3D0IVRXMA7fRmJQemhNQpTcHigiAA */
        schema: {
            context: {} as {
                request?: Request;
                attempts: number;
                maxAttempts: number;
                retryableStatusCodes: number[];
                retryableErrorCodes: string[];
                errors: unknown[];
                lastError?: unknown;
            },
            events: {} as { type: "FETCH"; request: Request },
            services: {} as {
                fetch: { data: Response };
                resolveErrorResponse: { data: { response: Response; apiError: ApiErrorResponse } };
            },
        },
        tsTypes: {} as import("./fetch-machine.typegen").Typegen0,
        predictableActionArguments: true,

        id: "fetchMachine",
        initial: "idle",

        context: {
            attempts: 0,
            maxAttempts: RETRY_DEFAULTS.maxAttempts,
            retryableStatusCodes: RETRY_DEFAULTS.retryableStatusCodes,
            retryableErrorCodes: RETRY_DEFAULTS.retryableErrorCodes,
            errors: [],
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

                    onDone: [
                        {
                            target: "complete",
                            cond: "isResponseOk",
                        },
                        {
                            target: "fetching",
                            cond: "isRetryableStatusCode",
                            actions: "setLastErrorFromRequestStatus",
                        },
                        {
                            target: "resolvingErrorResponse",
                            actions: "setLastErrorFromRequestStatus",
                        },
                    ],

                    onError: [
                        {
                            target: "fetching",
                            cond: "isRetryableError",
                            internal: false,
                            actions: ["setLastError"],
                        },
                        {
                            target: "failed",
                            actions: ["setLastError"],
                        },
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

            resolvingErrorResponse: {
                invoke: {
                    src: "resolveErrorResponse",

                    onError: {
                        target: "failed",
                        actions: ["setLastError"],
                    },

                    onDone: {
                        target: "failed",
                        actions: "setLastErrorFromApiError",
                    },
                },
            },

            complete: {
                type: "final",
                data: (context, event) => {
                    return event.request;
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

            setLastErrorFromRequestStatus: assign({
                lastError: (context, event) => {
                    return new Error(`${event.data.status}: ${event.data.statusText}`);
                },
            }),

            setLastErrorFromApiError: assign({
                lastError: (context, event) => {
                    const { apiError } = event.data;
                    return new Error(`${apiError.code}: ${apiError.message}`, { cause: apiError });
                },
            }),
        },

        guards: {
            isResponseOk: (context, event) => event.data.ok,

            isRetryableStatusCode: (context, event) => {
                return context.retryableStatusCodes.includes(event.data.status);
            },

            isRetryableError: (context, event) => {
                try {
                    const error = ErrorWithCauseCode.parse(event.data);
                    return context.retryableErrorCodes.includes(error.cause.code);
                } catch {
                    return false;
                }
            },
        },

        services: {
            fetch: async (context) => {
                logFetch(`Attempt: ${context.attempts}/${context.maxAttempts}`);

                if (!context.request) {
                    // TODO: Our own errors
                    throw new Error("TODO: Missing request!");
                }

                if (context.attempts > context.maxAttempts) {
                    // TODO: Our own errors
                    throw new Error(`Too many attempts`, { cause: context.lastError });
                }

                return await globalThis.fetch(context.request.clone());
            },

            resolveErrorResponse: async (context, event) => {
                const clonedResponse = event.data.clone();

                const responseBody = await clonedResponse.text();

                logFetch(
                    `Received response:\n====\n${clonedResponse.status} ${clonedResponse.statusText}\n----\n${responseBody}\n====`,
                );

                let apiError: ApiErrorResponse;

                try {
                    apiError = ApiErrorResponse.parse(JSON.parse(responseBody));
                } catch (error) {
                    logFetch(`Error encountered while parsing response:\n====\n${error}\n====`);
                    // logServicesResolveErrorResponse("abcd", error);
                    // logServicesResolveErrorResponse("def");
                    // Add last error to the thrown error, to have context what failed
                    if (error instanceof Error) {
                        error.cause = context.lastError;
                    }

                    // TODO: Our own errors
                    throw new Error(`Received unexpected response from the API:\n\n${responseBody}`, { cause: error });
                }

                return {
                    response: clonedResponse,
                    apiError,
                };
            },
        },
    },
);
