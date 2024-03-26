/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";
import { parseWithSchema } from "../zod/zod-parse";
import { getDecryptReadableStream } from "../crypto";
import { SessionFileHeaderMetadata } from "../schemas/api/session/session-file-header-metadata";
import { createBrotliDecompress } from "node:zlib";
import { nodeDuplexToWeb, streamToText } from "../node-streams";
import { DigiMeSdkError, DigiMeSdkTypeError } from "../errors/errors";

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

    get fileName(): DigiMeSessionFileHandlerOptions["fileName"] {
        return this.#fileName;
    }

    get metadata(): DigiMeSessionFileHandlerOptions["metadata"] {
        return this.#metadata;
    }

    get compression(): DigiMeSessionFileHandlerOptions["compression"] {
        return this.#compression;
    }

    get privateKey(): DigiMeSessionFileHandlerOptions["privateKey"] {
        return this.#privateKey;
    }

    /**
     * Returns a stream as it was provided, without any transformation applied to it.
     * Useful if you don't wish to process the stream now and just store it somewhere for later.
     */
    rawStream(): ReadableStream<Uint8Array> {
        return this.#input;
    }

    /**
     * Returns a stream with decryption and decompression transformers applied to it
     */
    async processedStream(): Promise<ReadableStream<Uint8Array>> {
        let pipeline = await getDecryptReadableStream(this.privateKey, this.rawStream());

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
    async textStream(): Promise<ReadableStream<string>> {
        return (await this.processedStream()).pipeThrough(new TextDecoderStream());
    }

    /**
     * Returns processed text representation of the file
     */
    async text(): Promise<string> {
        return await streamToText(await this.textStream());
    }

    /**
     * Returns the result of JSON parsing the processed text representation of the input file
     */
    async jsonParse(): Promise<unknown> {
        try {
            return JSON.parse(await this.text());
        } catch (error) {
            throw new DigiMeSdkError("Failed parsing file contents as JSON", { cause: error });
        }
    }

    // TODO: Type correctly
    async asJsonStream() {
        const { withParser } = await import("stream-json/streamers/StreamArray");
        return (await this.textStream()).pipeThrough(nodeDuplexToWeb(withParser()));
    }
}
