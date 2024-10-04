/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { shouldThrowError } from "./net";

describe("shouldThrowError", () => {
    it("should throw non-HTTPError errors", () => {
        const nonHttpError = new Error("Some error");
        expect(() => shouldThrowError(nonHttpError)).toThrow(nonHttpError);
    });
});
