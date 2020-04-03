/*!
 * Copyright (c) 2009-2020 digi.me Limited. All rights reserved.
 */

import { isCAFileResponse, CAFileResponse, assertIsCAFileResponse } from "./ca-file-response";
import { loadDefinitions, fileContentToCAFormat } from "../../../utils/test-utils";
import NodeRSA from "node-rsa";
import { TypeValidationError } from "../../errors";

const testKeyPair: NodeRSA = new NodeRSA({ b: 2048 });

const validFileMetadata: CAFileResponse["fileMetadata"] = {
    objectCount: 1,
    objectType: "test",
    serviceGroup: "test",
    serviceName: "test",
};

describe("isCAFileResponse", () => {

    it("Returns true when given a valid CAFileResponse", async () => {
        const fixtures = [
            ...loadDefinitions(`fixtures/network/get-file/valid-files.json`),
            ...loadDefinitions(`fixtures/network/get-file/valid-files-compression-gzip.json`),
            ...loadDefinitions(`fixtures/network/get-file/valid-files-compression-brotli.json`),
        ];

        const formattedFixtures = fileContentToCAFormat(fixtures, testKeyPair);

        expect.assertions(formattedFixtures.length);

        for (const fixture of formattedFixtures) {
            expect(isCAFileResponse(fixture.response)).toBe(true);
        }
    });

    describe("Returns false when given a non-object", () => {
        it.each([true, false, null, undefined, [], 0, NaN, "", () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                const actual = isCAFileResponse(value);
                expect(actual).toBe(false);
            },
        );
    });

    it("Returns false when given an empty object", () => {
        expect(isCAFileResponse({})).toBe(false);
    });

    it("Returns false when the fileContent property of the CAFileResponse object is not provided", () => {
        expect(isCAFileResponse({
            fileMetadata: validFileMetadata,
        })).toBe(false);
    });

    describe("Returns false when the fileContent property of the CAFileResponse object is not a string", () => {
        it.each([true, false, null, undefined, [], 0, NaN, {}, () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                const actual = isCAFileResponse({
                    fileContent: value,
                    fileMetadata: validFileMetadata,
                });
                expect(actual).toBe(false);
            },
        );
    });

    describe("Returns false when the compression property of the CAFileResponse object is present but not a string", () => {
        it.each([true, false, null, [], 0, NaN, {}, () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                const actual = isCAFileResponse({
                    fileContent: "test",
                    fileMetadata: validFileMetadata,
                    compression: value,
                });
                expect(actual).toBe(false);
            },
        );
    });

    describe("Returns false when the fileMetadata property of the CAFileResponse object is not an object", () => {
        it.each([true, false, null, undefined, [], 0, NaN, "", () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                const actual = isCAFileResponse({
                    fileContent: "test",
                    fileMetadata: value,
                });
                expect(actual).toBe(false);
            },
        );
    });

    it("Returns false when the fileMetadata property of the CAFileResponse object is an empty object", () => {
        const actual = isCAFileResponse({
            fileContent: "test",
            fileMetadata: {},
        });
        expect(actual).toBe(false);
    });

    describe("Returns false when the objectCount property of the fileMetadata object is not a number", () => {
        it.each([true, false, null, undefined, [], "", {}, () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                const actual = isCAFileResponse({
                    fileContent: "test",
                    fileMetadata: {
                        ...validFileMetadata,
                        objectCount: value,
                    },
                });
                expect(actual).toBe(false);
            },
        );
    });

    describe("Returns false when the objectType property of the fileMetadata object is not a string", () => {
        it.each([true, false, null, undefined, [], 0, NaN, {}, () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                const actual = isCAFileResponse({
                    fileContent: "test",
                    fileMetadata: {
                        ...validFileMetadata,
                        objectType: value,
                    },
                });
                expect(actual).toBe(false);
            },
        );
    });

    describe("Returns false when the serviceGroup property of the fileMetadata object is not a string", () => {
        it.each([true, false, null, undefined, [], 0, NaN, {}, () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                const actual = isCAFileResponse({
                    fileContent: "test",
                    fileMetadata: {
                        ...validFileMetadata,
                        serviceGroup: value,
                    },
                });
                expect(actual).toBe(false);
            },
        );
    });

    describe("Returns false when the serviceName property of the fileMetadata object is not a string", () => {
        it.each([true, false, null, undefined, [], 0, NaN, {}, () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                const actual = isCAFileResponse({
                    fileContent: "test",
                    fileMetadata: {
                        ...validFileMetadata,
                        serviceName: value,
                    },
                });
                expect(actual).toBe(false);
            },
        );
    });

    describe("Returns false when the mimetype property of the fileMetadata object is present but not a string", () => {
        it.each([true, false, null, [], 0, NaN, {}, () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                const actual = isCAFileResponse({
                    fileContent: "test",
                    fileMetadata: {
                        ...validFileMetadata,
                        mimetype: value,
                    },
                });
                expect(actual).toBe(false);
            },
        );
    });

});

describe("assertIsCAFileResponse", () => {

    it("Does not throw when given a valid CAFileResponse object", async () => {
        const fixtures = [
            ...loadDefinitions(`fixtures/network/get-file/valid-files.json`),
            ...loadDefinitions(`fixtures/network/get-file/valid-files-compression-gzip.json`),
            ...loadDefinitions(`fixtures/network/get-file/valid-files-compression-brotli.json`),
        ];

        const formattedFixtures = fileContentToCAFormat(fixtures, testKeyPair);

        expect.assertions(formattedFixtures.length);

        for (const fixture of formattedFixtures) {
            expect(() => assertIsCAFileResponse(fixture.response)).not.toThrow();
        }
    });

    describe("Throws TypeValidationError when given a non-object", () => {
        it.each([true, false, null, undefined, [], 0, NaN, "", () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                expect(() => assertIsCAFileResponse(value)).toThrow(TypeValidationError);
            },
        );
    });

    it("Throws TypeValidationError when given an empty object", () => {
        expect(() => assertIsCAFileResponse({})).toThrow(TypeValidationError);
    });

    it("Throws TypeValidationError when the fileContent property of the CAFileResponse object is not provided", () => {
        expect(() => assertIsCAFileResponse({
            fileMetadata: validFileMetadata,
        })).toThrow(TypeValidationError);
    });

    describe("Throws TypeValidationError when the fileContent property of the CAFileResponse object is not a string", () => {
        it.each([true, false, null, undefined, [], 0, NaN, {}, () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                const actual = () => assertIsCAFileResponse({
                    fileContent: value,
                    fileMetadata: validFileMetadata,
                });

                expect(actual).toThrow(TypeValidationError);
            },
        );
    });

    describe("Throws TypeValidationError when the compression property of the CAFileResponse object is present but not a string", () => {
        it.each([true, false, null, [], 0, NaN, {}, () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                const actual = () => assertIsCAFileResponse({
                    fileContent: "test",
                    fileMetadata: validFileMetadata,
                    compression: value,
                });
                expect(actual).toThrow(TypeValidationError);
            },
        );
    });

    describe("Throws TypeValidationError when the fileMetadata property of the CAFileResponse object is not an object", () => {
        it.each([true, false, null, undefined, [], 0, NaN, "", () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                const actual = () => assertIsCAFileResponse({
                    fileContent: "test",
                    fileMetadata: value,
                });
                expect(actual).toThrow(TypeValidationError);
            },
        );
    });

    it("Throws TypeValidationError when the fileMetadata property of the CAFileResponse object is an empty object", () => {
        const actual = () => assertIsCAFileResponse({
            fileContent: "test",
            fileMetadata: {},
        });
        expect(actual).toThrow(TypeValidationError);
    });

    describe("Throws TypeValidationError when the objectCount property of the fileMetadata object is not a number", () => {
        it.each([true, false, null, undefined, [], "", {}, () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                const actual = () => assertIsCAFileResponse({
                    fileContent: "test",
                    fileMetadata: {
                        ...validFileMetadata,
                        objectCount: value,
                    },
                });
                expect(actual).toThrow(TypeValidationError);
            },
        );
    });

    describe("Throws TypeValidationError when the objectType property of the fileMetadata object is not a string", () => {
        it.each([true, false, null, undefined, [], 0, NaN, {}, () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                const actual = () => assertIsCAFileResponse({
                    fileContent: "test",
                    fileMetadata: {
                        ...validFileMetadata,
                        objectType: value,
                    },
                });
                expect(actual).toThrow(TypeValidationError);
            },
        );
    });

    describe("Throws TypeValidationError when the serviceGroup property of the fileMetadata object is not a string", () => {
        it.each([true, false, null, undefined, [], 0, NaN, {}, () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                const actual = () => assertIsCAFileResponse({
                    fileContent: "test",
                    fileMetadata: {
                        ...validFileMetadata,
                        serviceGroup: value,
                    },
                });
                expect(actual).toThrow(TypeValidationError);
            },
        );
    });

    describe("Throws TypeValidationError when the serviceName property of the fileMetadata object is not a string", () => {
        it.each([true, false, null, undefined, [], 0, NaN, {}, () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                const actual = () => assertIsCAFileResponse({
                    fileContent: "test",
                    fileMetadata: {
                        ...validFileMetadata,
                        serviceName: value,
                    },
                });
                expect(actual).toThrow(TypeValidationError);
            },
        );
    });

    describe("Throws TypeValidationError when the mimetype property of the fileMetadata object is present but not a string", () => {
        it.each([true, false, null, [], 0, NaN, {}, () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                const actual = () => assertIsCAFileResponse({
                    fileContent: "test",
                    fileMetadata: {
                        ...validFileMetadata,
                        mimetype: value,
                    },
                });
                expect(actual).toThrow(TypeValidationError);
            },
        );
    });

    it("Throws TypeValidationError with custom error messages", () => {
        const actual = () => assertIsCAFileResponse(0, "Test error message");
        expect(actual).toThrow(TypeValidationError);
        expect(actual).toThrow("Test error message");
    });

    it("Throws TypeValidationError with custom formated error messages", () => {
        const actual = () => assertIsCAFileResponse(0, "Test start %s test end");
        expect(actual).toThrow(TypeValidationError);
        expect(actual).toThrow(/^Test start ([\s\S]*)? test end$/);
    });

});
