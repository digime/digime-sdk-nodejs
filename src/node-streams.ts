/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { Duplex, Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";

// This exists solely because Node Web ReadableStream types do not match global DOM ReadableStream types
export const nodeReadableFromWeb = (readableStream: ReadableStream): Readable =>
    Readable.fromWeb(readableStream as NodeReadableStream);

// This exists solely because Node Web ReadableStream types do not match global DOM ReadableStream types
export const nodeReadableToWeb = (nodeReadable: Readable): ReadableStream =>
    Readable.toWeb(nodeReadable) as ReadableStream;

/**
 * Convert Node.js Duplex to web TransformStream.
 *
 * NOTE: This exists solely because currently Node.js are wrong.
 * Duplex.toWeb results in a TransformStream, not a ReadableStream that the types annotate it as.
 */
export const nodeDuplexToWeb = <TInput = Uint8Array, TOutput = Uint8Array>(
    duplex: Duplex,
): TransformStream<TInput, TOutput> => {
    return Duplex.toWeb(duplex) as unknown as TransformStream<TInput, TOutput>;
};

/**
 * Consume a stream and return a textual representation
 */
export const streamToText = async (stream: ReadableStream): Promise<string> => {
    let text = "";
    for await (const chunk of stream as NodeReadableStream) {
        text += chunk;
    }
    return text;
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
