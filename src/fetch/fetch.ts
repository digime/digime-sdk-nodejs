/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { interpret } from "xstate";
import { fetchMachine } from "./fetch-machine";
import { waitFor } from "xstate/lib/waitFor";

/**
 * Extends [`Response`](https://developer.mozilla.org/docs/Web/API/Response) to
 * make `.json()` method return `Promise<unknown>` instead of `Promise<any>`
 */
export interface DigiMeFetchResponse extends Response {
    json(): Promise<unknown>;
}

export async function fetch(...parameters: ConstructorParameters<typeof Request>): Promise<DigiMeFetchResponse> {
    const fetchActor = interpret(fetchMachine)
        // .onTransition((state) => {
        //     console.log("===", state.value);
        // })
        .start();

    fetchActor.send({ type: "FETCH", request: new Request(...parameters) });

    const endState = await waitFor(fetchActor, (state) => Boolean(state.done), { timeout: Infinity });

    // XState types don't expose `data`, so we check for it
    if (!("data" in endState.event)) {
        throw new Error("TODO: No data in endState event, please report this");
    }

    // Return `Response`s
    if (endState.matches("complete") && endState.event.data instanceof Response) {
        return endState.event.data;
    }

    // Throw `Error`s
    if (endState.matches("failed")) {
        // TODO: Our errors
        // throw new AggregateError(endState.context.errors, "Network request failed");
        // console.log("-lastError", endState.context.lastError);
        throw new Error("Network request failed", { cause: endState.context.lastError });
    }

    // TODO: Our errors
    throw new Error("TODO: Unknown end state from state machine, please report this");
}
