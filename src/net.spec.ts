/*!
 * © World Data Exchange. All rights reserved.
 */

import { shouldThrowError } from "./net";

describe("shouldThrowError", () => {
    it("should throw non-HTTPError errors", () => {
        const nonHttpError = new Error("Some error");
        expect(() => shouldThrowError(nonHttpError)).toThrow(nonHttpError);
    });
});
