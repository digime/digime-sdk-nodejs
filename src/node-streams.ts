/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";

// This exists solely because Node Web ReadableStream types do not match global DOM ReadableStream types
export const webReadableStreamToNodeReadable = (readableStream: ReadableStream): Readable =>
    Readable.fromWeb(readableStream as NodeReadableStream);
