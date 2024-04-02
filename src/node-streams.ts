/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { Duplex, Readable } from "node:stream";
import type { ReadableStream } from "node:stream/web";
import type { TransformStream } from "node:stream/web";
import { concatUint8Array } from "./concat-uint8array";

/**
 * This exists solely so the toWeb conversion can be given a type.
 * Default conversion from Node Stream converts to `ReadableStream<any>` and accepts no type parameters
 */
export const nodeReadableToWeb = <T = unknown>(nodeReadable: Readable): ReadableStream<T> =>
    Readable.toWeb(nodeReadable);

/**
 * Convert Node.js Duplex to web TransformStream.
 *
 * NOTE: This exists solely because the Node.js types are currently wrong.
 * `Duplex` types inherit from `Readable` and `Duplex.toWeb()` claims to return a `ReadableStream`.
 * `Duplex.toWeb()` actually results in a TransformStream, as the @types/node claim.
 */
export const nodeDuplexToWeb = <TOutput = Uint8Array, TInput = Uint8Array>(
    duplex: Duplex,
): TransformStream<TInput, TOutput> => Duplex.toWeb(duplex) as unknown as TransformStream<TInput, TOutput>;

/**
 * Consume a string stream and return a textual representation
 */
export const streamToText = async (stream: ReadableStream<string>): Promise<string> => {
    let text = "";
    for await (const chunk of streamAsyncIterator(stream)) {
        text += chunk;
    }
    return text;
};

/**
 * Consume an Uint8Array stream and return a Uint8Array
 */
export const streamToUint8Array = async (stream: ReadableStream<Uint8Array>): Promise<Uint8Array> => {
    let buffer = new Uint8Array();
    for await (const chunk of streamAsyncIterator(stream)) {
        buffer = concatUint8Array(buffer, chunk);
    }
    return buffer;
};

/**
 * Gets an async iterator of the stream
 */
export async function* streamAsyncIterator<
    TStream extends ReadableStream,
    TReturn = TStream extends ReadableStream<infer TType> ? TType : never,
>(stream: TStream): AsyncGenerator<TReturn, void> {
    const reader = stream.getReader();

    try {
        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                return;
            }

            yield value;
        }
    } finally {
        reader.releaseLock();
    }
}
