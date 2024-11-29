/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { codecAssertion } from "./codec-assertion";
import * as t from "io-ts";
import { ThrowReporter } from "io-ts/lib/ThrowReporter";
import { sprintf } from "sprintf-js";
import { TypeValidationError } from "../errors";

jest.mock("sprintf-js", () => ({
    sprintf: jest.fn(),
}));

describe("codecAssertion", () => {
    const mockCodec = t.string;
    const assertWithCodec = codecAssertion(mockCodec);

    // Declare the spies explicitly
    let reportSpy: jest.SpyInstance;

    beforeEach(() => {
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        reportSpy = jest.spyOn(ThrowReporter, "report") as jest.SpyInstance;
        reportSpy.mockImplementation(() => {});
        (sprintf as jest.Mock).mockImplementation(() => "");
    });

    afterEach(() => {
        reportSpy.mockRestore();
        jest.restoreAllMocks();
    });

    it("should assert the value if it matches the codec type", () => {
        reportSpy.mockReturnValue("");

        expect(() => assertWithCodec("hello")).not.toThrow();
    });

    it("should throw TypeValidationError if the value does not match the codec type", () => {
        reportSpy.mockImplementation(() => {
            throw new Error("Invalid type");
        });
        (sprintf as jest.Mock).mockReturnValue("Error: Invalid type");

        expect(() => assertWithCodec(123)).toThrow(TypeValidationError);
        expect(() => assertWithCodec(123)).toThrow("Error: Invalid type");
    });

    it("should throw a non-error if something unexpected happens during validation", () => {
        reportSpy.mockImplementation(() => {
            // eslint-disable-next-line @typescript-eslint/only-throw-error
            throw "Some unexpected error";
        });

        expect(() => assertWithCodec(123)).toThrow("Some unexpected error");
    });

    it("should use the custom error message if provided", () => {
        reportSpy.mockImplementation(() => {
            throw new Error("Invalid type");
        });
        (sprintf as jest.Mock).mockReturnValue("Custom error message");

        expect(() => assertWithCodec(123, "Custom error: %s")).toThrow(TypeValidationError);
        expect(sprintf).toHaveBeenCalledWith("Custom error: %s", "Invalid type");
    });
});
