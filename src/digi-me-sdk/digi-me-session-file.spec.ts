/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { describe, test, expect } from "vitest";
import { DigiMeSessionFile } from "./digi-me-session-file";
import { DigiMeSdkError, DigiMeSdkTypeError } from "../errors/errors";
import { createFileEncryptPipeline, createReadStreamWeb } from "../../mocks/utilities";
import { randomInt } from "node:crypto";
import { readFile } from "node:fs/promises";
import { mockSdkConsumerCredentials } from "../../mocks/sdk-consumer-credentials";
import { nodeDuplexToWeb, streamToText, streamToUint8Array } from "../node-streams";
import { createBrotliCompress } from "node:zlib";
import { CompressionStream, ReadableStream } from "node:stream/web";

describe("DigiMeSessionFile", () => {
    describe("Constructor", () => {
        test("Works with minimal arguments", () => {
            const stream = new ReadableStream();
            const privateKey = "test-key";
            expect(() => new DigiMeSessionFile({ input: stream, privateKey })).not.toThrow();
        });

        test("Throws if provided no config", () => {
            try {
                // @ts-expect-error Not passing in arguments on purpose
                new DigiMeSessionFile();
                expect.unreachable();
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error).toBeInstanceOf(DigiMeSdkError);
                expect(error).toBeInstanceOf(DigiMeSdkTypeError);
                expect(error).toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`DigiMeSessionFileHandler\` constructor options (1 issue):
                   • Required]
                `);
            }
        });

        test("Throws if given wrong type as config", () => {
            try {
                // @ts-expect-error Passing in wrong arguments on purpose
                new DigiMeSessionFile([]);
                expect.unreachable();
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error).toBeInstanceOf(DigiMeSdkError);
                expect(error).toBeInstanceOf(DigiMeSdkTypeError);
                expect(error).toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`DigiMeSessionFileHandler\` constructor options (1 issue):
                   • Expected object, received array]
                `);
            }
        });

        test("Throws if provided an empty object as config", () => {
            try {
                // @ts-expect-error Passing empty object on purpose
                new DigiMeSessionFile({});
                expect.unreachable();
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error).toBeInstanceOf(DigiMeSdkError);
                expect(error).toBeInstanceOf(DigiMeSdkTypeError);
                expect(error).toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`DigiMeSessionFileHandler\` constructor options (2 issues):
                   • "input": Input not instance of ReadableStream
                   • "privateKey": Required]
                `);
            }
        });

        test("Throws if the values are of the wrong type in the provided config ", () => {
            try {
                new DigiMeSessionFile({
                    // @ts-expect-error Intentionally wrong
                    input: 1,
                    // @ts-expect-error Intentionally wrong
                    privateKey: ["a", "b", "c"],
                    // @ts-expect-error Intentionally wrong
                    fileName: null,
                    // @ts-expect-error Intentionally wrong
                    compression: "uimplemented-compression",
                    // @ts-expect-error Intentionally wrong
                    metadata: "",
                });
                expect.unreachable();
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error).toBeInstanceOf(DigiMeSdkError);
                expect(error).toBeInstanceOf(DigiMeSdkTypeError);
                expect(error).toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`DigiMeSessionFileHandler\` constructor options (5 issues):
                   • "input": Input not instance of ReadableStream
                   • "privateKey": Expected string, received array
                   • "fileName": Expected string, received null
                   • "compression": Invalid input
                   • "metadata": Invalid input]
                `);
            }
        });

        test("Throws if provided with a locked stream", () => {
            try {
                const input = new ReadableStream();
                input.getReader();
                const privateKey = "test-key";
                new DigiMeSessionFile({ input, privateKey });
                expect.unreachable();
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error).toBeInstanceOf(DigiMeSdkError);
                expect(error).toBeInstanceOf(DigiMeSdkTypeError);
                expect(error).toMatchInlineSnapshot(
                    `[DigiMeSdkTypeError: Can't instantiate \`DigiMeSessionFile\` with a locked stream]`,
                );
            }
        });

        describe(".rawStream()", () => {
            test("Returns the input stream", () => {
                const input = new ReadableStream();
                const privateKey = "test-key";
                const sessionFile = new DigiMeSessionFile({ input, privateKey });

                const result = sessionFile.rawStream();

                expect(result).toBe(input);
            });
        });

        describe(".processedStream()", () => {
            test("Handles uncompressed files", async () => {
                expect.assertions(3);

                const targetFile = new URL("../../mocks/session/content/test-mapped-file.json", import.meta.url);

                let dataStream = createReadStreamWeb(targetFile, {
                    highWaterMark: randomInt(1, 101),
                });

                dataStream = createFileEncryptPipeline(mockSdkConsumerCredentials.publicKey, dataStream);

                const sessionFile = new DigiMeSessionFile({
                    input: dataStream,
                    privateKey: mockSdkConsumerCredentials.privateKeyPkcs1PemString,
                });

                const resultStream = await sessionFile.processedStream();
                const resultBuffer = await streamToUint8Array(resultStream);
                const expected = await readFile(targetFile);

                expect(sessionFile.compression).toBe(undefined);
                expect(resultStream).instanceOf(ReadableStream);
                expect(expected.compare(resultBuffer)).toBe(0);
            });

            test("Handles `gzip` compression", async () => {
                expect.assertions(3);

                const targetFile = new URL("../../mocks/session/content/test-mapped-file.json", import.meta.url);

                let dataStream = createReadStreamWeb(targetFile, {
                    highWaterMark: randomInt(1, 101),
                }).pipeThrough(new CompressionStream("gzip"));

                dataStream = createFileEncryptPipeline(mockSdkConsumerCredentials.publicKey, dataStream);

                const sessionFile = new DigiMeSessionFile({
                    input: dataStream,
                    privateKey: mockSdkConsumerCredentials.privateKeyPkcs1PemString,
                    compression: "gzip",
                });

                const resultStream = await sessionFile.processedStream();
                const resultBuffer = await streamToUint8Array(resultStream);
                const expected = await readFile(targetFile);

                expect(sessionFile.compression).toBe("gzip");
                expect(resultStream).instanceOf(ReadableStream);
                expect(expected.compare(resultBuffer)).toBe(0);
            });

            test("Handles `brotli` compression", async () => {
                expect.assertions(3);

                const targetFile = new URL("../../mocks/session/content/test-mapped-file.json", import.meta.url);

                let dataStream = createReadStreamWeb(targetFile, {
                    highWaterMark: randomInt(1, 101),
                }).pipeThrough(nodeDuplexToWeb(createBrotliCompress()));

                dataStream = createFileEncryptPipeline(mockSdkConsumerCredentials.publicKey, dataStream);

                const sessionFile = new DigiMeSessionFile({
                    input: dataStream,
                    privateKey: mockSdkConsumerCredentials.privateKeyPkcs1PemString,
                    compression: "brotli",
                });

                const resultStream = await sessionFile.processedStream();
                const resultBuffer = await streamToUint8Array(resultStream);
                const expected = await readFile(targetFile);

                expect(sessionFile.compression).toBe("brotli");
                expect(resultStream).instanceOf(ReadableStream);
                expect(expected.compare(resultBuffer)).toBe(0);
            });
        });

        describe(".textStream()", () => {
            test("Produces a stream of UTF-8 text", async () => {
                expect.assertions(2);

                const targetFile = new URL("../../mocks/session/content/test-mapped-file.json", import.meta.url);

                let dataStream = createReadStreamWeb(targetFile, {
                    highWaterMark: randomInt(1, 101),
                });

                dataStream = createFileEncryptPipeline(mockSdkConsumerCredentials.publicKey, dataStream);

                const sessionFile = new DigiMeSessionFile({
                    input: dataStream,
                    privateKey: mockSdkConsumerCredentials.privateKeyPkcs1PemString,
                });

                const resultStream = await sessionFile.textStream();
                const result = await streamToText(resultStream);
                const expected = (await readFile(targetFile)).toString("utf-8");

                expect(resultStream).instanceOf(ReadableStream);
                expect(result).toBe(expected);
            });
        });

        describe(".text()", () => {
            test("Produces a UTF-8 string", async () => {
                expect.assertions(1);

                const targetFile = new URL("../../mocks/session/content/test-mapped-file.json", import.meta.url);

                let dataStream = createReadStreamWeb(targetFile, {
                    highWaterMark: randomInt(1, 101),
                });

                dataStream = createFileEncryptPipeline(mockSdkConsumerCredentials.publicKey, dataStream);

                const sessionFile = new DigiMeSessionFile({
                    input: dataStream,
                    privateKey: mockSdkConsumerCredentials.privateKeyPkcs1PemString,
                });

                const result = await sessionFile.text();
                const expected = (await readFile(targetFile)).toString("utf-8");

                expect(result).toBe(expected);
            });
        });

        describe(".asJsonStream()", () => {
            test.todo("Produces something", async () => {
                expect.assertions(1);

                const targetFile = new URL(
                    "../../mocks/api/permission-access/query/test-mapped-file.json",
                    import.meta.url,
                );

                let dataStream = createReadStreamWeb(targetFile, {
                    highWaterMark: randomInt(1, 101),
                });

                dataStream = createFileEncryptPipeline(mockSdkConsumerCredentials.publicKey, dataStream);

                const sessionFile = new DigiMeSessionFile({
                    input: dataStream,
                    privateKey: mockSdkConsumerCredentials.privateKeyPkcs1PemString,
                });

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const result = await sessionFile.asJsonStream();

                // for await (const x of result) {
                //     console.log(x);
                // }

                // const expected = (await readFile(targetFile)).toString("utf-8");

                // expect(result).toBe(expected);
            });
        });
    });
});
