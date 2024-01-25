/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { describe, test, expect } from "vitest";
import { TrustedJwks } from "./trusted-jwks";
import { fromMockApiBase, getTestUrl } from "../mocks/utilities";
import { DigiMeSdkError, DigiMeSdkTypeError } from "./errors/errors";

describe("TrustedJwks", () => {
    describe("getJwksKeyResolverForUrl", () => {
        test("Gets the default JWKS without manually adding it", () => {
            const result = TrustedJwks.getJwksKeyResolverForUrl(fromMockApiBase("jwks/oauth"));
            expect(result).toBeInstanceOf(Function);
        });

        test("Throws when trying to get a JWKS that was not added as trusted", () => {
            const operation = () => {
                TrustedJwks.getJwksKeyResolverForUrl(new URL(".well-known/jwks", getTestUrl()).toString());
            };

            expect(operation).toThrow(DigiMeSdkError);
            expect(operation).toThrowErrorMatchingInlineSnapshot(`
              [DigiMeSdkError: Attempted to get a JWKS key resolver for an URL that has not yet been added as a trusted JWKS URL.

              A JWKS URL is marked as trusted when:
              • You manually call \`addUrlAsTrustedJWKS\` with a URL
              • Instantiate a DigiMeSDK instance with a \`baseUrl\` other than the default one,
                This adds "<baseUrl>/jwks/oauth" as a trusted JWKS URL]
            `);
        });

        test("Throws when the URL is malformed", () => {
            const operation = () => TrustedJwks.getJwksKeyResolverForUrl("test/.well-known/jwks");
            expect(operation).toThrow(DigiMeSdkTypeError);
            expect(operation).toThrowErrorMatchingInlineSnapshot(`
              [DigiMeSdkTypeError: Encountered an unexpected value for \`url\` argument (1 issue):
               • Invalid url]
            `);
        });
    });

    describe("addUrlAsTrustedJwks", () => {
        test("Adds a valid URL", () => {
            const url = getTestUrl(".well-known/jwks");
            const result = TrustedJwks.addUrlAsTrustedJwks(url);
            const keyGetter = TrustedJwks.getJwksKeyResolverForUrl(url);

            expect(result).toBe(undefined);
            expect(keyGetter).toBeInstanceOf(Function);
        });

        test("Throws when the URL is malformed", () => {
            const operation = () => TrustedJwks.addUrlAsTrustedJwks("test/.well-known/jwks");
            expect(operation).toThrow(DigiMeSdkTypeError);
            expect(operation).toThrowErrorMatchingInlineSnapshot(`
              [DigiMeSdkTypeError: Encountered an unexpected value for \`url\` argument (1 issue):
               • Invalid url]
            `);
        });
    });
});
