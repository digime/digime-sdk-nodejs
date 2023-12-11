/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { interpret } from "xstate";
import { fetchMachine } from "./fetch-machine";
import { waitFor } from "xstate/lib/waitFor";
import { logFetch } from "../debug-log";
import { DigiMeSdkError, DigiMeSdkTypeError } from "../errors/errors";

/**
 * Extends [`Response`](https://developer.mozilla.org/docs/Web/API/Response) to
 * make `.json()` method return `Promise<unknown>` instead of `Promise<any>`
 */
export interface DigiMeFetchResponse extends Response {
    json(): Promise<unknown>;
}

export async function fetch(...parameters: ConstructorParameters<typeof Request>): Promise<DigiMeFetchResponse> {
    const outgoingRequest = new Request(...parameters);

    logFetch(`[${outgoingRequest.url}] Initializing`);

    const fetchActor = interpret(fetchMachine)
        .onTransition((state) => {
            logFetch(`[${state.context.request?.url || outgoingRequest.url}] State: ${state.value}`);
        })
        .start();

    logFetch(`[${outgoingRequest.url}] Sending FETCH to state machine`);
    fetchActor.send({ type: "FETCH", request: outgoingRequest });

    const endState = await waitFor(fetchActor, (state) => Boolean(state.done), { timeout: Infinity });
    logFetch(`[${endState.context.request?.url}] Fetch machine resolved in: "${endState.value}"`);

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
