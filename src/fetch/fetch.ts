/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { interpret } from "xstate";
import { fetchMachine } from "./fetch-machine";
import { waitFor } from "xstate/lib/waitFor";
import { logFetchWrapper } from "../debug-log";
import { DigiMeSdkError, DigiMeSdkTypeError } from "../errors/errors";
import type { RetryOptions } from "./retry";

/**
 * Extends [`Response`](https://developer.mozilla.org/docs/Web/API/Response) to
 * make `.json()` method return `Promise<unknown>` instead of `Promise<any>`
 */
export interface DigiMeFetchWrapperResponse extends Response {
    json(): Promise<unknown>;
}

/**
 * Extra configuration options for the wrapper
 */
interface FetchWrapperConfig {
    retryOptions?: Partial<RetryOptions>;
}

export async function fetchWrapper(
    input: ConstructorParameters<typeof Request>[0],
    init?: ConstructorParameters<typeof Request>[1],
    wrapperConfig?: FetchWrapperConfig,
): Promise<DigiMeFetchWrapperResponse> {
    const outgoingRequest = new Request(input, init);

    logFetchWrapper(`[${outgoingRequest.url}] Initializing`);

    const fetchActor = interpret(fetchMachine)
        .onTransition((state) => {
            logFetchWrapper(`[${state.context.request?.url || outgoingRequest.url}] State: ${state.value}`);
        })
        .start();

    logFetchWrapper(`[${outgoingRequest.url}] Sending FETCH to state machine`);
    fetchActor.send({ type: "FETCH", request: outgoingRequest, retryOptions: wrapperConfig?.retryOptions });

    const endState = await waitFor(fetchActor, (state) => Boolean(state.done), { timeout: Infinity });
    logFetchWrapper(`[${endState.context.request?.url}] Fetch machine resolved in: "${endState.value}"`);

    // XState types don't expose `data`, even though it should be there, so we check for it
    if (!("data" in endState.event)) {
        // This shouldn't happen unless either we or XState are the cause of it
        throw new DigiMeSdkTypeError(
            `Fetch state machine finished without "data" in the resolved event. Please report this as a bug.`,
        );
    }

    // Return `Response`s
    if (endState.matches("complete") && endState.event.data instanceof Response) {
        return endState.event.data;
    }

    // Throw errors
    if (endState.matches("failed")) {
        // if (endState.context.lastError instanceof DigiMeSdkApiError) {
        throw endState.context.lastError;
        // }

        // throw new DigiMeSdkError("Network request failed", { cause: endState.context.lastError });
    }

    // Fallthrough case, this shouldn't be reached unless either we or XState are the cause of it
    throw new DigiMeSdkError("Fetch state machine resolved in an unexpected final state. Please report this as a bug.");
}
