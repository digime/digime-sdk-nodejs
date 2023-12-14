/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { describe, test, expect, vi } from "vitest";
import { mswServer } from "../mocks/server";
import { fetch } from "./fetch";
import { HttpResponse, http } from "msw";
import { DigiMeSdkApiError, DigiMeSdkError } from "../errors/errors";
import { formatBodyError, formatHeadersError } from "../mocks/utilities";

describe("fetch", () => {
    test("Returns response on success", async () => {
        mswServer.use(http.get("https://fetch.test/", () => HttpResponse.text("fetch-success", { status: 200 })));

        const response = await fetch("https://fetch.test/");

        expect.assertions(2);

        expect(response).toBeInstanceOf(Response);
        await expect(response.text()).resolves.toBe("fetch-success");
    });

    describe("Aborting", () => {
        test("Can be aborted with AbortSignal", async () => {
            mswServer.use(http.get("https://fetch.test/", () => HttpResponse.text("fetch-success", { status: 200 })));

            const responsePromise = fetch("https://fetch.test/", { signal: AbortSignal.abort() });

            expect.assertions(3);

            await expect(responsePromise).rejects.toBeInstanceOf(Error);
            await expect(responsePromise).rejects.toBeInstanceOf(DOMException);
            await expect(responsePromise).rejects.toHaveProperty("name", "AbortError");
        });

        test("Can be aborted with AbortSignal while waiting to retry", async () => {
            mswServer.use(
                http.get("https://fetch.test/", () =>
                    HttpResponse.text("fetch-failed", {
                        status: 500,
                        headers: {
                            // Correctly functioning fetch wrapper should respect this header
                            // and attempt to wait for 2 seconds.
                            "Retry-After": "2",
                        },
                    }),
                ),
            );

            performance.mark("fetch-start");

            const responsePromise = fetch("https://fetch.test/", {
                // We pass in the abort signal that will trigger in 50 milliseconds, so that retry never happens
                signal: AbortSignal.timeout(50),
            });

            responsePromise.catch(() => {
                performance.measure("fetch-reject", "fetch-start");
            });

            expect.assertions(4);
            await expect(responsePromise).rejects.toBeInstanceOf(Error);
            await expect(responsePromise).rejects.toBeInstanceOf(DOMException);
            await expect(responsePromise).rejects.toThrowErrorMatchingInlineSnapshot(
                `[TimeoutError: The operation was aborted due to timeout]`,
            );

            /**
             * This fails the test if fetch doesn't reject, or reject within 200ms.
             *
             * - If this assertion fails by being compared to `NaN`:
             *   The fetch didn't reject and is indicative of a problem with the AbortSignal handling
             *
             * - If this assertion fails by with the duration being larger than expected:
             *   Abort wasn't handled in "waitForRetry" and instead the real fetch has rejected in "fetching" state,
             *   which is not the correct behavior.
             */
            expect(Number(performance.getEntriesByName("fetch-reject")[0]?.duration)).toBeLessThan(200);
        });
    });

    describe("Errors", () => {
        test("Throws DigiMeApiError when the API responds with a well formed error response and non-retryable status code", async () => {
            mswServer.use(
                http.get(
                    "https://fetch.test/",
                    () => {
                        const error = { code: "TestError", message: "Test error" };
                        return HttpResponse.json(formatBodyError(error), {
                            status: 409,
                            headers: formatHeadersError(error),
                        });
                    },
                    { once: true },
                ),
            );

            const fetchPromise = fetch("https://fetch.test/");

            expect.assertions(3);
            await expect(fetchPromise).rejects.toBeInstanceOf(Error);
            await expect(fetchPromise).rejects.toBeInstanceOf(DigiMeSdkApiError);
            await expect(fetchPromise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkApiError: Digi.me API responded with the following error:
                   • Code: TestError
                   • Message: Test error
                   • Reference: --MOCKED ERROR--]
                `);
        });

        test('Throws if the "Retry-After" header for a retryable response is too long', async () => {
            mswServer.use(
                http.get(
                    "https://fetch-retry-after-long.test/",
                    () =>
                        HttpResponse.text("fetch-503", {
                            status: 503,
                            headers: { "Retry-After": "60" },
                        }),
                    { once: true },
                ),
            );

            const fetchPromise = fetch("https://fetch-retry-after-long.test/");

            await expect(fetchPromise).rejects.toThrowError(Error);
            await expect(fetchPromise).rejects.toThrowError(DigiMeSdkError);
            await expect(fetchPromise).rejects.toThrowErrorMatchingInlineSnapshot(
                `[DigiMeSdkError: Encountered a retryable response, but the "Retry-After" specified a delay over 10000ms]`,
            );
        });
    });

    describe("Retry logic", () => {
        test('Uses "Retry-After" header for retry delay', async () => {
            const secondsToWait = 8;

            mswServer.use(
                http.get(
                    "https://fetch-retry-after.test/",
                    () =>
                        HttpResponse.text("fetch-500", {
                            status: 503,
                            headers: { "Retry-After": secondsToWait.toString() },
                        }),
                    { once: true },
                ),
                http.get("https://fetch-retry-after.test/", () => HttpResponse.text("fetch-success", { status: 200 }), {
                    once: true,
                }),
            );

            vi.useFakeTimers();

            const fetchPromise = fetch("https://fetch-retry-after.test/");

            let advancedByTime = 0;
            await vi.waitFor(() => {
                advancedByTime += 50;

                const handlers = mswServer.listHandlers();

                const allHandlersUsed = handlers.every((handler) => handler.isUsed);

                vi.advanceTimersByTime(1000);
                advancedByTime += 1000;

                if (!allHandlersUsed) {
                    throw new Error("Unused handlers present");
                }
            });

            const response = await fetchPromise;

            vi.useRealTimers();

            expect.assertions(3);

            await expect(fetchPromise).resolves.toBeInstanceOf(Response);
            await expect(response.text()).resolves.toBe("fetch-success");
            expect(advancedByTime).toBeGreaterThanOrEqual(secondsToWait * 1000);
        });

        test("Retries on 500 error code", async () => {
            mswServer.use(
                http.get("https://fetch.test/", () => HttpResponse.text("fetch-500", { status: 500 }), { once: true }),
                http.get("https://fetch.test/", () => HttpResponse.text("fetch-success", { status: 200 }), {
                    once: true,
                }),
            );

            const response = await fetch("https://fetch.test/");

            expect.assertions(3);
            expect(response).toBeInstanceOf(Response);
            await expect(response.text()).resolves.toBe("fetch-success");
            expect(mswServer.listHandlers()).toMatchObject([{ isUsed: true }, { isUsed: true }]);
        });

        test("Retries on network errors", async () => {
            mswServer.use(
                http.get("https://fetch.test", () => HttpResponse.error(), { once: true }),
                http.get("https://fetch.test", () => HttpResponse.text("fetch-success", { status: 200 })),
            );

            const response = await fetch("https://fetch.test");

            expect.assertions(2);
            expect(response).toBeInstanceOf(Response);
            await expect(response.text()).resolves.toBe("fetch-success");
        });

        test("Can retry requests with consumable bodies", async () => {
            mswServer.use(
                http.post("https://fetch.test/", () => HttpResponse.text("wrong-test-string", { status: 500 }), {
                    once: true,
                }),
                // Echo body
                http.post(
                    "https://fetch.test/",
                    async ({ request }) => new HttpResponse(request.body, { status: 200 }),
                    {
                        once: true,
                    },
                ),
            );

            const response = await fetch("https://fetch.test/", { method: "POST", body: "test-string" });

            expect(await response.text()).toBe("test-string");
            expect.assertions(1);
        });
    });
});
