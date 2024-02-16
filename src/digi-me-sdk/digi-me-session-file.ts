/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";
import { parseWithSchema } from "../zod/zod-parse";
import { getDecryptReadableStream } from "../crypto";
import { SessionFileHeaderMetadata } from "../schemas/api/session/session-file-header-metadata";
import { createBrotliDecompress } from "node:zlib";
import { nodeDuplexToWeb, streamToText } from "../node-streams";
import { DigiMeSdkTypeError } from "../errors/errors";

const DigiMeSessionFileHandlerOptions = z.object({
    input: z.instanceof(ReadableStream<Uint8Array>),
    privateKey: z.string(),
    fileName: z.string().optional(),
    compression: SessionFileHeaderMetadata.shape.compression.optional(),
    metadata: SessionFileHeaderMetadata.shape.metadata.optional(),
});

type DigiMeSessionFileHandlerOptions = z.infer<typeof DigiMeSessionFileHandlerOptions>;

export class DigiMeSessionFile {
    #input: DigiMeSessionFileHandlerOptions["input"];
    #privateKey: DigiMeSessionFileHandlerOptions["privateKey"];
    #fileName: DigiMeSessionFileHandlerOptions["fileName"];
    #compression: DigiMeSessionFileHandlerOptions["compression"];
    #metadata: DigiMeSessionFileHandlerOptions["metadata"];

    constructor(options: DigiMeSessionFileHandlerOptions) {
        const { input, compression, fileName, metadata, privateKey } = parseWithSchema(
            options,
            DigiMeSessionFileHandlerOptions,
            "`DigiMeSessionFileHandler` constructor options",
        );

        if (input.locked) {
            throw new DigiMeSdkTypeError("Can't instantiate `DigiMeSessionFile` with a locked stream");
        }

        this.#input = input;
        this.#privateKey = privateKey;
        this.#fileName = fileName;
        this.#compression = compression;
        this.#metadata = metadata;
    }

    get fileName(): string | undefined {
        return this.#fileName;
    }

    get metadata() {
        return this.#metadata;
    }

    get compression() {
        return this.#compression;
    }

    get privateKey(): string {
        return this.#privateKey;
    }

    /**
     * Returns a stream with no transformation applied to it.
     * Useful, for example, if you don't wish to decypher the stream now and just store it somewhere for later.
     */
    asRawStream(): ReadableStream<Uint8Array> {
        return this.#input;
    }

    /**
     * Returns a stream with decryption and decompression transformers
     */
    async asProcessedStream(): Promise<ReadableStream<Uint8Array>> {
        let pipeline = await getDecryptReadableStream(this.privateKey, this.asRawStream());

        if (this.compression === "brotli") {
            pipeline = pipeline.pipeThrough(nodeDuplexToWeb(createBrotliDecompress()));
        } else if (this.compression === "gzip") {
            pipeline = pipeline.pipeThrough(new DecompressionStream("gzip"));
        }

        return pipeline;
    }

    /**
     * Returns a processed text stream
     */
    async asTextStream(): Promise<ReadableStream<string>> {
        return (await this.asProcessedStream()).pipeThrough(new TextDecoderStream());
    }

    /**
     * Returns text representation of the file
     */
    async asText(): Promise<string> {
        return await streamToText(await this.asTextStream());
    }

    /**
     * Returns JSON representation of the file
     */
    async asJson(): Promise<unknown> {
        return JSON.parse(await this.asText());
    }

    async asJsonStream() {
        const { parser } = (await import("stream-json")).default;
        const { streamArray } = (await import("stream-json/streamers/StreamArray")).default;
        return (await this.asTextStream())
            .pipeThrough(nodeDuplexToWeb(parser()))
            .pipeThrough(nodeDuplexToWeb(streamArray()));
    }
}
