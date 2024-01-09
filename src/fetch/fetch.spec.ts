/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { describe, test, expect, vi } from "vitest";
import { mswServer } from "../mocks/server";
import { fetchWrapper } from "./fetch";
import { HttpResponse, http } from "msw";
import { DigiMeSdkApiError, DigiMeSdkError, DigiMeSdkTypeError } from "../errors/errors";
import { formatBodyError, formatHeadersError } from "../mocks/utilities";

describe("fetch", () => {
    test("Returns response on success", async () => {
        mswServer.use(http.get("https://fetch.test/", () => HttpResponse.text("fetch-success", { status: 200 })));

        const response = await fetchWrapper("https://fetch.test/");

        expect.assertions(2);

        expect(response).toBeInstanceOf(Response);
        await expect(response.text()).resolves.toBe("fetch-success");
    });

    describe("Wrapper config", () => {
        test("Uses custom maximum retry attempts", async () => {
            mswServer.use(
                http.get("https://fetch.test/", () => HttpResponse.text("fetch-500", { status: 500 }), { once: true }),
                http.get("https://fetch.test/", () => HttpResponse.text("fetch-success", { status: 200 }), {
                    once: true,
                }),
            );

            const fetchPromise = fetchWrapper("https://fetch.test/", undefined, {
                retryOptions: {
                    maxAttempts: 0,
                },
            });

            expect.assertions(3);
            await expect(fetchPromise).rejects.toBeInstanceOf(Error);
            await expect(fetchPromise).rejects.toBeInstanceOf(DigiMeSdkTypeError);
            await expect(fetchPromise).rejects.toMatchInlineSnapshot(
                `[DigiMeSdkTypeError: Received unexpected error response from the Digi.me API]`,
            );
        });

        test("Uses custom delay calculator", async () => {
            mswServer.use(
                http.get("https://fetch.test/", () => HttpResponse.text("fetch-500", { status: 500 }), { once: true }),
                http.get("https://fetch.test/", () => HttpResponse.text("fetch-success", { status: 200 }), {
                    once: true,
                }),
            );

            const fetchPromise = fetchWrapper("https://fetch.test/", undefined, {
                retryOptions: {
                    calculateDelay: () => {
                        throw new Error("Custom calculateDelay error");
                    },
                },
            });

            expect.assertions(2);
            await expect(fetchPromise).rejects.toBeInstanceOf(Error);
            await expect(fetchPromise).rejects.toMatchInlineSnapshot(`[Error: Custom calculateDelay error]`);
        });

        test("Uses custom retryable status codes", async () => {
            mswServer.use(
                http.get("https://fetch.test/", () => HttpResponse.text("fetch-402", { status: 402 }), { once: true }),
                http.get("https://fetch.test/", () => HttpResponse.text("fetch-success", { status: 200 }), {
                    once: true,
                }),
            );

            const response = await fetchWrapper("https://fetch.test/", undefined, {
                retryOptions: {
                    statusCodes: [402],
                },
            });

            expect.assertions(2);
            expect(response).toBeInstanceOf(Response);
            await expect(response.text()).resolves.toBe("fetch-success");
        });

        test("Uses custom error retry checker", async () => {
            mswServer.use(
                http.get("https://fetch.test", () => HttpResponse.error(), { once: true }),
                http.get("https://fetch.test/", () => HttpResponse.text("fetch-success", { status: 200 }), {
                    once: true,
                }),
            );

            const fetchPromise = fetchWrapper("https://fetch.test/", undefined, {
                retryOptions: {
                    isErrorRetryable: () => {
                        return false;
                    },
                },
            });

            expect.assertions(2);
            await expect(fetchPromise).rejects.toBeInstanceOf(Error);
            await expect(fetchPromise).rejects.toMatchInlineSnapshot(`[TypeError: Failed to fetch]`);
        });

        test("Uses custom limit for `Retry-After` header", async () => {
            mswServer.use(
                http.get(
                    "https://fetch.test/",
                    () =>
                        HttpResponse.text("fetch-503", {
                            status: 503,
                            headers: { "Retry-After": "2" },
                        }),
                    { once: true },
                ),
                http.get("https://fetch.test/", () => HttpResponse.text("fetch-success", { status: 200 }), {
                    once: true,
                }),
            );

            const fetchPromise = fetchWrapper("https://fetch.test/", undefined, {
                retryOptions: {
                    maxRetryAfterDelay: 1000,
                },
            });

            expect.assertions(2);
            await expect(fetchPromise).rejects.toBeInstanceOf(Error);
            await expect(fetchPromise).rejects.toMatchInlineSnapshot(
                `[DigiMeSdkTypeError: Received unexpected error response from the Digi.me API]`,
            );
        });
    });

    describe("Aborting", () => {
        test("Can be aborted with AbortSignal", async () => {
            mswServer.use(http.get("https://fetch.test/", () => HttpResponse.text("fetch-success", { status: 200 })));

            const responsePromise = fetchWrapper("https://fetch.test/", { signal: AbortSignal.abort() });

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

            const responsePromise = fetchWrapper("https://fetch.test/", {
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
        test("Throws DigiMeSdkApiError when the API responds with a well formed error response and non-retryable status code", async () => {
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

            const fetchPromise = fetchWrapper("https://fetch.test/");

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

        describe('Throws if the "Retry-After" header for a retryable response is too long', () => {
            test("In number format", async () => {
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

                const fetchPromise = fetchWrapper("https://fetch-retry-after-long.test/");

                await expect(fetchPromise).rejects.toThrowError(Error);
                await expect(fetchPromise).rejects.toThrowError(DigiMeSdkError);
                await expect(fetchPromise).rejects.toThrowErrorMatchingInlineSnapshot(
                    `[DigiMeSdkTypeError: Received unexpected error response from the Digi.me API]`,
                );
            });

            test("In date format", async () => {
                mswServer.use(
                    http.get(
                        "https://fetch-retry-after-long.test/",
                        () =>
                            HttpResponse.text("fetch-503", {
                                status: 503,
                                headers: { "Retry-After": new Date(Date.now() + 60000).toUTCString() },
                            }),
                        { once: true },
                    ),
                );

                const fetchPromise = fetchWrapper("https://fetch-retry-after-long.test/");

                await expect(fetchPromise).rejects.toThrowError(Error);
                await expect(fetchPromise).rejects.toThrowError(DigiMeSdkError);
                await expect(fetchPromise).rejects.toThrowErrorMatchingInlineSnapshot(
                    `[DigiMeSdkTypeError: Received unexpected error response from the Digi.me API]`,
                );
            });
        });
    });

    describe("Retry logic", () => {
        describe('"Retry-After" header', () => {
            test.each(["number", "date"] as const)(`Works in %s format`, async (retryAfterFormat) => {
                // Retry-After header set to 8 seconds in both types
                const retryAfterValue = retryAfterFormat === "number" ? "8" : new Date(Date.now() + 8000).toUTCString();

                mswServer.use(
                    http.get(
                        "https://fetch-retry-after.test/",
                        () =>
                            HttpResponse.text("fetch-500", {
                                status: 503,
                                headers: { "Retry-After": retryAfterValue },
                            }),
                        { once: true },
                    ),
                    http.get(
                        "https://fetch-retry-after.test/",
                        () => HttpResponse.text("fetch-success", { status: 200 }),
                        {
                            once: true,
                        },
                    ),
                );

                vi.useFakeTimers();

                const fetchPromise = fetchWrapper("https://fetch-retry-after.test/");

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
                expect(advancedByTime).toBeGreaterThanOrEqual(8000);
            });

            test(`Ignores bad values`, async () => {
                mswServer.use(
                    http.get(
                        "https://fetch-retry-after.test/",
                        () =>
                            HttpResponse.text("fetch-500", {
                                status: 503,
                                headers: { "Retry-After": "@#$%" },
                            }),
                        { once: true },
                    ),
                    http.get(
                        "https://fetch-retry-after.test/",
                        () => HttpResponse.text("fetch-success", { status: 200 }),
                        {
                            once: true,
                        },
                    ),
                );

                const response = await fetchWrapper("https://fetch-retry-after.test/");

                expect.assertions(2);
                expect(response).toBeInstanceOf(Response);
                await expect(response.text()).resolves.toBe("fetch-success");
            });
        });

        test("Retries on 500 error code", async () => {
            mswServer.use(
                http.get("https://fetch.test/", () => HttpResponse.text("fetch-500", { status: 500 }), { once: true }),
                http.get("https://fetch.test/", () => HttpResponse.text("fetch-success", { status: 200 }), {
                    once: true,
                }),
            );

            const response = await fetchWrapper("https://fetch.test/");

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

            const response = await fetchWrapper("https://fetch.test");

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

            const response = await fetchWrapper("https://fetch.test/", { method: "POST", body: "test-string" });

            expect(await response.text()).toBe("test-string");
            expect.assertions(1);
        });

        test("Throws eventually even if the server keeps responding with a retryable error", async () => {
            mswServer.use(
                http.get("https://fetch.test/", () => {
                    const error = { code: "TestError", message: "Test error" };
                    return HttpResponse.json(formatBodyError(error), {
                        status: 500,
                        headers: formatHeadersError(error),
                    });
                }),
            );

            const fetchPromise = fetchWrapper("https://fetch.test/");

            expect.assertions(2);
            await expect(fetchPromise).rejects.toBeInstanceOf(Error);
            await expect(fetchPromise).rejects.toMatchInlineSnapshot(`
              [DigiMeSdkApiError: Digi.me API responded with the following error:
               • Code: TestError
               • Message: Test error
               • Reference: --MOCKED ERROR--]
            `);
        });
    });
});
