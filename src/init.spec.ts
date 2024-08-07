/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import nock from "nock";
import { TypeValidationError } from "./errors";
import { init } from "./init";

/* eslint-disable @typescript-eslint/no-explicit-any */

beforeEach(() => {
    nock.cleanAll();
});

describe("init", () => {
    describe("Returns an object containing", () => {
        it.each([
            "getAuthorizeUrl",
            "getReauthorizeAccountUrl",
            "refreshToken",
            "getOnboardServiceUrl",
            "exchangeCodeForToken",
            "pushData",
            "readSession",
            "deleteUser",
            "readFile",
            "readFileList",
            "readAllFiles",
            "readAccounts",
            "querySources",
            "queryCountries",
            "queryPlatforms",
            "queryCategories",
        ])("%s function", (property) => {
            const SDK = init({ applicationId: "valid-application-id" });
            expect(SDK).toHaveProperty(property, expect.any(Function));
        });
    });

    describe("Throws TypeValidationError when options (first parameter) is", () => {
        // tslint:disable-next-line:max-line-length
        it.each([true, false, null, [], 0, NaN, "", (): null => null, Symbol("test"), { baseUrl: null }])(
            "%p",
            (options: any) => {
                expect(() => init(options)).toThrow(TypeValidationError);
            }
        );
    });

    describe("Throws TypeValidationError when applicationId is", () => {
        // tslint:disable-next-line:max-line-length
        it.each([true, false, null, [], 0, NaN, "", (): null => null, Symbol("test"), { baseUrl: null }])(
            "%p",
            (applicationId: any) => {
                expect(() => init({ applicationId })).toThrow(TypeValidationError);
            }
        );
    });
});
