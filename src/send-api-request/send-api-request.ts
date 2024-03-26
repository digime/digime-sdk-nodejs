/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { createActor, waitFor } from "xstate";
import type { RequestInitializer } from "./api-request-machine";
import { apiRequestMachine } from "./api-request-machine";
import { logSendApiRequest } from "../debug-log";
import { DigiMeSdkError } from "../errors/errors";
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
    const requestActor = createActor(apiRequestMachine, {
        input: {
            requestInitializer,
            retryOptions: config?.retryOptions,
        },
    }).start();

    requestActor.subscribe((state) => {
        let label = "UNKNOWN REQUEST";

        if (state.context.request) {
            label = `${state.context.request?.method} ${state.context.request?.url}`;
        }

        logSendApiRequest(`[${label}] State: ${state.value}`);
    });

    requestActor.send({ type: "START" });

    const endState = await waitFor(requestActor, ({ status }) => status === "done", { timeout: Infinity });

    logSendApiRequest(`[${endState.context.request?.url}] Fetch machine resolved in: "${endState.value}"`);

    // Return `Response`s
    if (endState.matches("complete") && endState.output instanceof Response) {
        return endState.output;
    }

    // Throw errors
    if (endState.matches("failed")) {
        throw endState.output;
    }

    // Fallthrough case, this shouldn't be reached unless either we or XState are the cause of it
    throw new DigiMeSdkError(
        "API request state machine resolved in an unexpected final state. Please report this as a bug.",
    );
}
