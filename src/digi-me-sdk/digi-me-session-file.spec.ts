/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { describe, test, expect } from "vitest";
import { DigiMeSessionFile } from "./digi-me-session-file";
import { DigiMeSdkError, DigiMeSdkTypeError } from "../errors/errors";

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
                });
                expect.unreachable();
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect(error).toBeInstanceOf(DigiMeSdkError);
                expect(error).toBeInstanceOf(DigiMeSdkTypeError);
                expect(error).toMatchInlineSnapshot(`
                  [DigiMeSdkTypeError: Encountered an unexpected value for \`DigiMeSessionFileHandler\` constructor options (2 issues):
                   • "input": Input not instance of ReadableStream
                   • "privateKey": Expected string, received array]
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

        describe(".asRawStream", () => {
            test("Returns the input stream", () => {
                const input = new ReadableStream();
                const privateKey = "test-key";
                const sessionFile = new DigiMeSessionFile({ input, privateKey });

                const result = sessionFile.asRawStream();

                expect(result).toBe(input);
            });
        });
    });
});
