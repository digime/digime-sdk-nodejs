/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { assertIsCAFileHeaderResponse } from "./ca-file-response";
import { loadDefinitions, fileContentToCAFormat } from "../../../utils/test-utils";
import NodeRSA from "node-rsa";
import { TypeValidationError } from "../../errors";

const testKeyPair: NodeRSA = new NodeRSA({ b: 2048 });

const validFileMetadata = {
    objectCount: 1,
    objectType: "test",
    serviceGroup: "test",
    serviceName: "test",
};

describe("assertIsCAFileHeaderResponse", () => {
    it("Does not throw when given a valid CAFileResponse object", async () => {
        const fixtures = [
            ...loadDefinitions(`fixtures/network/get-file/valid-files.json`),
            ...loadDefinitions(`fixtures/network/get-file/valid-files-compression-gzip.json`),
            ...loadDefinitions(`fixtures/network/get-file/valid-files-compression-brotli.json`),
        ];

        const formattedFixtures = fileContentToCAFormat(fixtures, testKeyPair);

        expect.assertions(formattedFixtures.length);

        for (const fixture of formattedFixtures) {
            expect(() => assertIsCAFileHeaderResponse(fixture.rawHeaders)).not.toThrow();
        }
    });

    describe("Throws TypeValidationError when given a non-string", () => {
        it.each([true, false, null, undefined, [], 0, NaN, {}, () => null, Symbol("test")])("%p", (value) => {
            expect(() => assertIsCAFileHeaderResponse(value)).toThrow(TypeValidationError);
        });
    });

    it("Throws TypeValidationError when given an empty object", () => {
        expect(() => assertIsCAFileHeaderResponse({})).toThrow(TypeValidationError);
    });

    it("Throws TypeValidationError when the fileContent property of the CAFileResponse object is not provided", () => {
        expect(() =>
            assertIsCAFileHeaderResponse({
                fileMetadata: validFileMetadata,
            })
        ).toThrow(TypeValidationError);
    });

    describe("Throws TypeValidationError when the fileContent property of the CAFileResponse object is not a string", () => {
        it.each([true, false, null, undefined, [], 0, NaN, {}, () => null, Symbol("test")])("%p", (value) => {
            const actual = () =>
                assertIsCAFileHeaderResponse({
                    fileContent: value,
                    fileMetadata: validFileMetadata,
                });

            expect(actual).toThrow(TypeValidationError);
        });
    });

    describe("Throws TypeValidationError when the compression property of the CAFileResponse object is present but not a string", () => {
        it.each([true, false, null, [], 0, NaN, {}, () => null, Symbol("test")])("%p", (value) => {
            const actual = () =>
                assertIsCAFileHeaderResponse({
                    fileContent: "test",
                    fileMetadata: validFileMetadata,
                    compression: value,
                });
            expect(actual).toThrow(TypeValidationError);
        });
    });

    describe("Throws TypeValidationError when the fileMetadata property of the CAFileResponse object is not an object", () => {
        it.each([true, false, null, undefined, [], 0, NaN, "", () => null, Symbol("test")])("%p", (value) => {
            const actual = () =>
                assertIsCAFileHeaderResponse({
                    fileContent: "test",
                    fileMetadata: value,
                });
            expect(actual).toThrow(TypeValidationError);
        });
    });

    it("Throws TypeValidationError when the fileMetadata property of the CAFileResponse object is an empty object", () => {
        const actual = () =>
            assertIsCAFileHeaderResponse({
                fileContent: "test",
                fileMetadata: {},
            });
        expect(actual).toThrow(TypeValidationError);
    });

    describe("Throws TypeValidationError when the objectCount property of the fileMetadata object is not a number", () => {
        it.each([true, false, null, undefined, [], "", {}, () => null, Symbol("test")])("%p", (value) => {
            const actual = () =>
                assertIsCAFileHeaderResponse({
                    fileContent: "test",
                    fileMetadata: {
                        ...validFileMetadata,
                        objectCount: value,
                    },
                });
            expect(actual).toThrow(TypeValidationError);
        });
    });

    describe("Throws TypeValidationError when the objectType property of the fileMetadata object is not a string", () => {
        it.each([true, false, null, undefined, [], 0, NaN, {}, () => null, Symbol("test")])("%p", (value) => {
            const actual = () =>
                assertIsCAFileHeaderResponse({
                    fileContent: "test",
                    fileMetadata: {
                        ...validFileMetadata,
                        objectType: value,
                    },
                });
            expect(actual).toThrow(TypeValidationError);
        });
    });

    describe("Throws TypeValidationError when the serviceGroup property of the fileMetadata object is not a string", () => {
        it.each([true, false, null, undefined, [], 0, NaN, {}, () => null, Symbol("test")])("%p", (value) => {
            const actual = () =>
                assertIsCAFileHeaderResponse({
                    fileContent: "test",
                    fileMetadata: {
                        ...validFileMetadata,
                        serviceGroup: value,
                    },
                });
            expect(actual).toThrow(TypeValidationError);
        });
    });

    describe("Throws TypeValidationError when the serviceName property of the fileMetadata object is not a string", () => {
        it.each([true, false, null, undefined, [], 0, NaN, {}, () => null, Symbol("test")])("%p", (value) => {
            const actual = () =>
                assertIsCAFileHeaderResponse({
                    fileContent: "test",
                    fileMetadata: {
                        ...validFileMetadata,
                        serviceName: value,
                    },
                });
            expect(actual).toThrow(TypeValidationError);
        });
    });

    describe("Throws TypeValidationError when the mimetype property of the fileMetadata object is present but not a string", () => {
        it.each([true, false, null, [], 0, NaN, {}, () => null, Symbol("test")])("%p", (value) => {
            const actual = () =>
                assertIsCAFileHeaderResponse({
                    fileContent: "test",
                    fileMetadata: {
                        mimetype: value,
                    },
                });
            expect(actual).toThrow(TypeValidationError);
        });
    });

    describe("Throws TypeValidationError when the accounts property of the fileMetadata object is present but not an array", () => {
        it.each([true, false, null, "Test string", 0, NaN, {}, () => null, Symbol("test")])("%p", (value) => {
            const actual = () =>
                assertIsCAFileHeaderResponse({
                    fileContent: "test",
                    fileMetadata: {
                        accounts: value,
                    },
                });
            expect(actual).toThrow(TypeValidationError);
        });
    });

    it("Throws TypeValidationError with custom error messages", () => {
        const actual = () => assertIsCAFileHeaderResponse(0, "Test error message");
        expect(actual).toThrow(TypeValidationError);
        expect(actual).toThrow("Test error message");
    });

    it("Throws TypeValidationError with custom formated error messages", () => {
        const actual = () => assertIsCAFileHeaderResponse(0, "Test start %s test end");
        expect(actual).toThrow(TypeValidationError);
        expect(actual).toThrow(/^Test start ([\S\s]*)? test end$/);
    });
});
