/*!
 * © World Data Exchange. All rights reserved.
 */

import { sleep } from "./sleep";

describe("sleep", () => {
    jest.useFakeTimers();

    it("should return a Promise", () => {
        const result = sleep(1000);
        expect(result).toBeInstanceOf(Promise);
    });

    it("should resolve after the specified time", async () => {
        const mockFn = jest.fn();

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        sleep(1000).then(mockFn);

        expect(mockFn).not.toHaveBeenCalled();

        jest.advanceTimersByTime(1000);
        await Promise.resolve();

        expect(mockFn).toHaveBeenCalled();
    });

    it("should not resolve before the specified time", async () => {
        const mockFn = jest.fn();

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        sleep(2000).then(mockFn);

        jest.advanceTimersByTime(1000);
        await Promise.resolve();

        expect(mockFn).not.toHaveBeenCalled();

        jest.advanceTimersByTime(1000);
        await Promise.resolve();

        expect(mockFn).toHaveBeenCalled();
    });
});
