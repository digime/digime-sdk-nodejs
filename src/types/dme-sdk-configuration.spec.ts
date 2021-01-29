/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import { isDMESDKConfiguration, assertIsDMESDKConfiguration } from "./dme-sdk-configuration";
import { TypeValidationError } from "../errors";

describe("isDMESDKConfiguration", () => {

    it("Returns true when given a minimal valid DMESDKConfiguration", async () => {
        const config = {
            baseUrl: "https://api.digi.me",
        };

        expect(isDMESDKConfiguration(config)).toBe(true);
    });

    it("Returns true when given a valid DMESDKConfiguration with retryOptions", async () => {
        const config = {
            baseUrl: "https://api.digi.me",
            retryOptions: {},
        };

        expect(isDMESDKConfiguration(config)).toBe(true);
    });

    describe("Returns false when given a non-object", () => {
        it.each([true, false, null, undefined, [], 0, NaN, "", () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                const actual = isDMESDKConfiguration(value);
                expect(actual).toBe(false);
            },
        );
    });

    it("Returns false when given an empty object", () => {
        expect(isDMESDKConfiguration({})).toBe(false);
    });

    describe("Returns false when the baseUrl property is not a string", () => {
        it.each([true, false, null, undefined, [], 0, NaN, {}, () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                const actual = isDMESDKConfiguration({
                    baseUrl: value,
                });
                expect(actual).toBe(false);
            },
        );
    });

});

describe("assertIsDMESDKConfiguration", () => {


    it("Does not throw when given a minimal valid DMESDKConfiguration", async () => {
        const config = {
            baseUrl: "https://api.digi.me",
        };

        expect(() => assertIsDMESDKConfiguration(config)).not.toThrow();
    });

    it("Does not throw when given a valid DMESDKConfiguration with retryOptions", async () => {
        const config = {
            baseUrl: "https://api.digi.me",
            retryOptions: {},
        };

        expect(() => assertIsDMESDKConfiguration(config)).not.toThrow();
    });

    describe("Throws TypeValidationError when given a non-object", () => {
        it.each([true, false, null, undefined, [], 0, NaN, "", () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                const actual = () => assertIsDMESDKConfiguration(value);
                expect(actual).toThrow(TypeValidationError);
            },
        );
    });

    it("Throws TypeValidationError when given an empty object", () => {
        expect(() => assertIsDMESDKConfiguration({})).toThrow(TypeValidationError);
    });

    describe("Throws TypeValidationError when the baseUrl property is not a string", () => {
        it.each([true, false, null, undefined, [], 0, NaN, {}, () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                const actual = () => assertIsDMESDKConfiguration({
                    baseUrl: value,
                });
                expect(actual).toThrow(TypeValidationError);
            },
        );
    });

    it("Throws TypeValidationError with custom error messages", () => {
        const actual = () => assertIsDMESDKConfiguration({}, "Test error message");
        expect(actual).toThrow(TypeValidationError);
        expect(actual).toThrow("Test error message");
    });

    it("Throws TypeValidationError with custom formated error messages", () => {
        const actual = () => assertIsDMESDKConfiguration({}, "Test start %s test end");
        expect(actual).toThrow(TypeValidationError);
        expect(actual).toThrow(/^Test start ([\s\S]*)? test end$/);
    });

});
