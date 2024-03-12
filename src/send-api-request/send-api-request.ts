/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { interpret } from "xstate";
import type { RequestInitializer } from "./api-request-machine";
import { apiRequestMachine } from "./api-request-machine";
import { waitFor } from "xstate/lib/waitFor";
import { logSendApiRequest } from "../debug-log";
import { DigiMeSdkError, DigiMeSdkTypeError } from "../errors/errors";
import type { RetryOptions } from "./retry";

/**
 * Extends [`Response`](https://developer.mozilla.org/docs/Web/API/Response) to
 * make `.json()` method return `Promise<unknown>` instead of `Promise<any>`
 */
export interface DigiMeSendApiRequestResponse extends Response {
    json(): Promise<unknown>;
}

/**
 * Extra configuration options for the wrapper
 */
interface SendApiRequestConfig {
    retryOptions?: Partial<RetryOptions>;
}

export async function sendApiRequest(
    requestInitializer: RequestInitializer,
    config?: SendApiRequestConfig,
): Promise<DigiMeSendApiRequestResponse> {
    const requestActor = interpret(apiRequestMachine)
        .onTransition((state) => {
            let label = "UNKNOWN REQUEST";

            if (state.context.request) {
                label = `${state.context.request?.method} ${state.context.request?.url}`;
            }

            logSendApiRequest(`[${label}] State: ${state.value}`);
        })
        .start();

    requestActor.send({ type: "START", requestInitializer, retryOptions: config?.retryOptions });

    const endState = await waitFor(requestActor, (state) => Boolean(state.done), { timeout: Infinity });
    logSendApiRequest(`[${endState.context.request?.url}] Fetch machine resolved in: "${endState.value}"`);

    // XState types don't expose `data`, even though it should be there, so we check for it
    if (!("data" in endState.event)) {
        // This shouldn't happen unless either we or XState are the cause of it
        throw new DigiMeSdkTypeError(
            `API request state machine finished without "data" in the resolved event. Please report this as a bug.`,
        );
    }

    // Return `Response`s
    if (endState.matches("complete") && endState.event.data instanceof Response) {
        return endState.event.data;
    }

    // Throw errors
    if (endState.matches("failed")) {
        throw endState.context.lastError;
    }

    // Fallthrough case, this shouldn't be reached unless either we or XState are the cause of it
    throw new DigiMeSdkError(
        "API request state machine resolved in an unexpected final state. Please report this as a bug.",
    );
}
