/*!
 * Copyright (c) 2009-2020 digi.me Limited. All rights reserved.
 */

import { isSession, assertIsSession } from "./session"
import { TypeValidationError } from "../../errors";

describe("isSession", () => {

    it("Returns true when given a valid session", async () => {
        const fixtures = (await import("../../../fixtures/network/establish-session/valid-session.json")).default;

        expect.assertions(2);

        for (const fixture of fixtures.values()) {
            expect(isSession(fixture.response)).toBe(true);
        }
    });

    describe("Returns false when given a non-object", () => {
        it.each([true, false, null, undefined, [], 0, NaN, "", () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                const actual = isSession(value);
                expect(actual).toBe(false);
            },
        );
    });

    it("Returns false when given an empty object", () => {
        expect(isSession({})).toBe(false);
    });

    describe("Returns false when expiry is not a number", () => {
        it.each([true, false, null, undefined, [], {}, "", () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                const actual = isSession({
                    expiry: value,
                    sessionKey: "test-session-key",
                    sessionExchangeToken: "test-session-exchange-token",
                });
                expect(actual).toBe(false);
            },
        );
    });

    describe("Returns false when sessionKey is not a string", () => {
        it.each([true, false, null, NaN, undefined, [], {}, () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                const actual = isSession({
                    expiry: 0,
                    sessionKey: value,
                    sessionExchangeToken: "test-session-exchange-token",
                });
                expect(actual).toBe(false);
            },
        );
    });

    describe("Returns false when sessionExchangeToken is not a string", () => {
        it.each([true, false, null, NaN, undefined, [], {}, () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                const actual = isSession({
                    expiry: 0,
                    sessionKey: "test-session-key",
                    sessionExchangeToken: value,
                });
                expect(actual).toBe(false);
            },
        );
    });

});

describe("assertIsSession", () => {

    it("Does not throw when given a valid session", async () => {
        const fixtures = (await import("../../../fixtures/network/establish-session/valid-session.json")).default;

        expect.assertions(2);

        for (const fixture of fixtures.values()) {
            expect(() => assertIsSession(fixture.response)).not.toThrow();
        }
    });

    describe("Throws TypeValidationError when given a non-object", () => {
        it.each([true, false, null, undefined, [], 0, NaN, "", () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                const actual = () => assertIsSession(value);
                expect(actual).toThrow(TypeValidationError);
            },
        );
    });

    it("Throws TypeValidationError when given an empty object", () => {
        expect(() => assertIsSession({})).toThrow(TypeValidationError);
    });

    describe("Throws TypeValidationError when expiry is not a number", () => {
        it.each([true, false, null, undefined, [], {}, "", () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                const actual = () => assertIsSession({
                    expiry: value,
                    sessionKey: "test-session-key",
                    sessionExchangeToken: "test-session-exchange-token",
                });
                expect(actual).toThrow(TypeValidationError);
            },
        );
    });

    describe("Throws TypeValidationError when sessionKey is not a string", () => {
        it.each([true, false, null, NaN, undefined, [], {}, () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                const actual = () => assertIsSession({
                    expiry: 0,
                    sessionKey: value,
                    sessionExchangeToken: "test-session-exchange-token",
                });
                expect(actual).toThrow(TypeValidationError);
            },
        );
    });

    describe("Throws TypeValidationError when sessionExchangeToken is not a string", () => {
        it.each([true, false, null, NaN, undefined, [], {}, () => null, Symbol("test")])(
            "%p",
            (value: any) => {
                const actual = () => assertIsSession({
                    expiry: 0,
                    sessionKey: "test-session-key",
                    sessionExchangeToken: value,
                });
                expect(actual).toThrow(TypeValidationError);
            },
        );
    });

    it("Throws TypeValidationError with custom error messages", () => {
        const actual = () => assertIsSession({}, "Test error message");
        expect(actual).toThrow(TypeValidationError);
        expect(actual).toThrow("Test error message");
    });

    it("Throws TypeValidationError with custom formated error messages", () => {
        const actual = () => assertIsSession({}, "Test start %s test end");
        expect(actual).toThrow(TypeValidationError);
        expect(actual).toThrow(/^Test start ([\s\S]*)? test end$/);
    });

});
