/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { createMachine, assign } from "xstate";
import { ApiErrorResponse } from "../types/external/api-error-response";
import { ErrorWithCauseCode } from "../types/error-with-cause-code";

const RETRY_DEFAULTS = {
    maxAttempts: 3,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504, 521, 522, 524],
    retryableErrorCodes: ["ENOTFOUND", "ENETUNREACH", "EAI_AGAIN", "ECONNREFUSED", "ECONNRESET"],
};

// const getBearerTokenFromRequest = (request: Request): string | undefined => {
//     const auth = request.headers.get("Authorization");

//     // No expected Authorization header
//     if (!auth || !auth.startsWith("Bearer ")) {
//         return undefined;
//     }

//     return auth.split(" ")[1];
// };

// TODO: Handle aborts in other parts of the machine
export const fetchMachine = createMachine(
    {
        /** @xstate-layout N4IgpgJg5mDOIC5QDMwBcDGALAsgQ2wEsA7MAOkIgBswBiAMQFEAVAYQAkBtABgF1FQABwD2sQmkLDiAkAA9EARm4AmMgGZuAFgBsAdjUBWA9zUAObdoUAaEAE9Ea1QbUBObse4vdn7QF9fNqiYuARYJORBRMRQtBBS5CQAbsIA1hHo2PhR6cEkUAhJwhh4ElI8vOUyImKl0khyisqqCpZNJpa6usoGLjb2CMqmmmTc3EODygoGyi4Gmv6BGSHZZJFh0bHxFMTJaatLWes5UfmFxbXlnAr89dXiknWg8gim3GQGui4KLmoaJk0ubR9BxmMgKTQ6Iy6AwKWFjPwBEBrQ7hfa5DZxUjbXbHZZHNEnAo7IolB6XZQ3ISie5SGTPBSDMimFwuHSmZTaGbaLTAhAQt7GWGmFo-OZihZIg6hVFrPK0MAAJwVwgVZEEVBKyBVAFsCXiZUs8kTkucyXxKrdqbU6YhlLptOpDKzdAozNDuC1eWphiY3M5NGoFKZjEYJcjpVjZRtFcrVerNTq9SjI4bosaSRdzdcqlaHjaEB83tpNO4hizzEYgXYHD7XGMS11tDDOWGpSsFXBhFREnlGEqVQAlOAiYiwOiYhLEvbh9ud7u9-sKoewEdj9Omsrmvg5mp5+rPAC03reCk69tm2iGmhcyl5miMYNmge9mlM+h6reCyfIHdgXZ70R9rGy6ruOWyFNObb4r+-4LsBw5SGuZykpuFTZpau60vuiAHoMujvMWr66CWHLQsomi8pYPrkde15eICZifpkEY-nOAFQEBg4IaOdAxiqaoamgWoKrqM7QWxcFcSuiFgOuKHEJc24YTSjwNHyPTqNohhmJokzKL8Bi8s4ahMh60zKGMajaF4TH6liHbIL+6xQMwqRgMQmxYhBuLfmQDlOXkrlpMQcmZhUSlUphqmHrC+Ecq81m6KYaifB8t7Vgg3wKGQ3jPpoUzkXa7K2b5-lwM5QXufKi4CQmIlJixflgI55WBW5IXIWFFqRSp+YHhCLhkF45issWpjsuCvLeKYBHdF0wZWQyCj+IixDCBAcAyGJ4Q7r12EIAeMLNJygyApMpamLyh3DICniaPozK-Ho94lY1lA0Lt1r7QeUxkGN+X5V0KUWPdRkGO8Uw9Fp3BJS0rgGK9KxRlAn17k8igpSMZH2sYl4uOYvJTCZuUMgjiLbZGeCEDQECo1h6MIOeZB0d4nJ6G+Mxg9RwrcCdoyzGTixfo1MHzoBi4gTJdPRY04M3pe3JaQtdq9BlYpkN0OgQtZ3JJboiP4hgwjauq6BgNL+YQtl+hWU05hmTChkZYM2XdOMN6BqeGj6+TUGomVsAVe1FvfVrYIncynJKAY42ExYOUmK6KXdKeMKmCtvhAA */
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

                    onDone: [
                        {
                            target: "refreshingToken",
                            cond: "canRetryByRefreshingToken",
                            actions: ["setLastErrorFromApiError"],
                        },
                        {
                            target: "failed",
                            actions: ["setLastErrorFromApiError"],
                        },
                    ],

                    onError: {
                        target: "failed",
                        actions: ["setLastError"],
                    },
                },
            },

            complete: {
                type: "final",
                data: (context, event) => {
                    return event.request;
                },
            },

            refreshingToken: {
                invoke: {
                    src: "refreshToken",
                    onDone: "fetching",
                    onError: "failed",
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

            canRetryByRefreshingToken: (context, event) => {
                const { response, apiError } = event.data;

                // Somehow we're here without a request?
                if (!context.request) return false;

                // We didn't send a token
                if (!context.request.headers.has("Authorization")) return false;

                // Wrong status code for refresh
                if (response.status !== 401) return false;

                // Error is not related to the token
                if (apiError.code !== "InvalidToken") return false;

                return true;
            },
        },

        services: {
            fetch: async (context) => {
                if (!context.request) {
                    // TODO: Our own errors
                    throw new Error("TODO: Missing request!");
                }

                if (context.attempts > context.maxAttempts) {
                    // TODO: Our own errors
                    throw new Error(`Too many attempts`, { cause: context.lastError });
                }

                return await fetch(context.request);
            },

            resolveErrorResponse: async (context, event) => {
                const clonedResponse = event.data.clone();
                // const clonedResponse = new Response("", { status: 501 });

                let apiError: ApiErrorResponse;

                try {
                    apiError = ApiErrorResponse.parse(await clonedResponse.json());
                } catch (error) {
                    // Add last error to the thrown error, to have context what failed
                    if (error instanceof Error) {
                        error.cause = context.lastError;
                    }

                    // TODO: Our own errors
                    throw new Error("Received unexpected response from the API", { cause: error });
                }

                return {
                    response: clonedResponse,
                    apiError,
                };
            },

            refreshToken: async () => {},
        },
    },
);
