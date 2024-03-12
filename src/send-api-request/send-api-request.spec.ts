/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { describe, test, expect, vi } from "vitest";
import { mswServer } from "../../mocks/server";
import { sendApiRequest } from "./send-api-request";
import { HttpResponse, http } from "msw";
import { DigiMeSdkApiError, DigiMeSdkError, DigiMeSdkTypeError } from "../errors/errors";
import { formatBodyError, formatHeadersError, getTestUrl } from "../../mocks/utilities";
import { abortableDelay } from "../abortable-delay";
import { randomInt } from "node:crypto";

describe("sendApiRequest", () => {
    test("Returns response on success", async () => {
        const url = getTestUrl();
        mswServer.use(http.get(url, () => HttpResponse.text("fetch-success", { status: 200 })));

        const response = await sendApiRequest(() => new Request(url));

        expect.assertions(2);

        expect(response).toBeInstanceOf(Response);
        await expect(response.text()).resolves.toBe("fetch-success");
    });

    describe("Config", () => {
        test("Uses custom maximum retry attempts", async () => {
            const url = getTestUrl();
            mswServer.use(
                http.get(url, () => HttpResponse.text("fetch-500", { status: 500 }), { once: true }),
                http.get(url, () => HttpResponse.text("fetch-success", { status: 200 }), {
                    once: true,
                }),
            );

            const fetchPromise = sendApiRequest(() => new Request(url, undefined), {
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
            const url = getTestUrl();
            mswServer.use(
                http.get(url, () => HttpResponse.text("fetch-500", { status: 500 }), { once: true }),
                http.get(url, () => HttpResponse.text("fetch-success", { status: 200 }), {
                    once: true,
                }),
            );

            const fetchPromise = sendApiRequest(() => new Request(url, undefined), {
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
            const url = getTestUrl();
            mswServer.use(
                http.get(url, () => HttpResponse.text("fetch-402", { status: 402 }), { once: true }),
                http.get(url, () => HttpResponse.text("fetch-success", { status: 200 }), {
                    once: true,
                }),
            );

            const response = await sendApiRequest(() => new Request(url, undefined), {
                retryOptions: {
                    statusCodes: [402],
                },
            });

            expect.assertions(2);
            expect(response).toBeInstanceOf(Response);
            await expect(response.text()).resolves.toBe("fetch-success");
        });

        test("Uses custom error retry checker", async () => {
            const url = getTestUrl();
            mswServer.use(
                http.get(url, () => HttpResponse.error(), { once: true }),
                http.get(url, () => HttpResponse.text("fetch-success", { status: 200 }), {
                    once: true,
                }),
            );

            const fetchPromise = sendApiRequest(() => new Request(url, undefined), {
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
            const url = getTestUrl();
            mswServer.use(
                http.get(
                    url,
                    () =>
                        HttpResponse.text("fetch-503", {
                            status: 503,
                            headers: { "Retry-After": "2" },
                        }),
                    { once: true },
                ),
                http.get(url, () => HttpResponse.text("fetch-success", { status: 200 }), {
                    once: true,
                }),
            );

            const fetchPromise = sendApiRequest(() => new Request(url, undefined), {
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
            const url = getTestUrl();
            mswServer.use(http.get(url, () => HttpResponse.text("fetch-success", { status: 200 })));

            const responsePromise = sendApiRequest(() => new Request(url, { signal: AbortSignal.abort() }));

            expect.assertions(2);

            await expect(responsePromise).rejects.toBeInstanceOf(Error);
            await expect(responsePromise).rejects.toHaveProperty("name", "AbortError");
        });

        test("Can be aborted with AbortSignal while waiting to retry", async () => {
            const url = getTestUrl();
            mswServer.use(
                http.get(url, () =>
                    HttpResponse.text("Try again", {
                        status: 500,
                        headers: {
                            // Correctly functioning fetch wrapper should respect this header
                            // and attempt to wait for 4 seconds.
                            "Retry-After": "4",
                        },
                    }),
                ),
            );

            const abortController = new AbortController();

            performance.mark("fetch-start");

            const responsePromise = sendApiRequest(
                () =>
                    new Request(url, {
                        // We pass in the abort signal that will trigger in 50 milliseconds, so that retry never happens
                        signal: abortController.signal,
                    }),
                { retryOptions: { maxAttempts: 2 } },
            );

            await abortableDelay(500);
            abortController.abort();

            responsePromise.catch(() => {
                performance.measure("fetch-reject", "fetch-start");
            });

            expect.assertions(4);
            await expect(responsePromise).rejects.toBeInstanceOf(Error);
            await expect(responsePromise).rejects.toHaveProperty("name", "AbortError");
            await expect(responsePromise).rejects.toThrowErrorMatchingInlineSnapshot(
                `[AbortError: This operation was aborted]`,
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
            expect(Number(performance.getEntriesByName("fetch-reject")[0]?.duration)).toBeLessThan(2000);
        });
    });

    describe("Errors", () => {
        test("Throws DigiMeSdkApiError when the API responds with a well formed error response and non-retryable status code", async () => {
            const url = getTestUrl();
            mswServer.use(
                http.get(
                    url,
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

            const fetchPromise = sendApiRequest(() => new Request(url));

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
                const url = getTestUrl();
                mswServer.use(
                    http.get(
                        url,
                        () =>
                            HttpResponse.text("fetch-503", {
                                status: 503,
                                headers: { "Retry-After": "60" },
                            }),
                        { once: true },
                    ),
                );

                const fetchPromise = sendApiRequest(() => new Request(url));

                await expect(fetchPromise).rejects.toThrowError(Error);
                await expect(fetchPromise).rejects.toThrowError(DigiMeSdkError);
                await expect(fetchPromise).rejects.toThrowErrorMatchingInlineSnapshot(
                    `[DigiMeSdkTypeError: Received unexpected error response from the Digi.me API]`,
                );
            });

            test("In date format", async () => {
                const url = getTestUrl();
                mswServer.use(
                    http.get(
                        url,
                        () =>
                            HttpResponse.text("fetch-503", {
                                status: 503,
                                headers: { "Retry-After": new Date(Date.now() + 60000).toUTCString() },
                            }),
                        { once: true },
                    ),
                );

                const fetchPromise = sendApiRequest(() => new Request(url));

                await expect(fetchPromise).rejects.toThrowError(Error);
                await expect(fetchPromise).rejects.toThrowError(DigiMeSdkError);
                await expect(fetchPromise).rejects.toThrowErrorMatchingInlineSnapshot(
                    `[DigiMeSdkTypeError: Received unexpected error response from the Digi.me API]`,
                );
            });
        });
    });

    describe("Retry logic", () => {
        test("Makes the correct amount of retries", async () => {
            const url = getTestUrl();
            const maxRetryAttempts = randomInt(0, 9);
            let retryRequests = 0;

            mswServer.use(
                // First request is always made
                http.get(
                    url,
                    () => {
                        return HttpResponse.text("fetch-500", { status: 500 });
                    },
                    { once: true },
                ),
                // Count retry requests
                http.get(url, () => {
                    retryRequests++;
                    return HttpResponse.text("fetch-500", { status: 500 });
                }),
            );

            const fetchPromise = sendApiRequest(() => new Request(url, undefined), {
                retryOptions: {
                    maxAttempts: maxRetryAttempts,
                    calculateDelay: async () => 5,
                },
            });
            expect.assertions(2);
            await expect(fetchPromise).rejects.toMatchInlineSnapshot(
                `[DigiMeSdkTypeError: Received unexpected error response from the Digi.me API]`,
            );
            expect(retryRequests).toBe(maxRetryAttempts);
        });

        describe('"Retry-After" header', () => {
            test.each(["number", "date"] as const)(`Works in %s format`, async (retryAfterFormat) => {
                // Retry-After header set to 8 seconds in both types
                const retryAfterValue = retryAfterFormat === "number" ? "8" : new Date(Date.now() + 8000).toUTCString();

                const url = getTestUrl();
                mswServer.use(
                    http.get(
                        url,
                        () =>
                            HttpResponse.text("fetch-500", {
                                status: 503,
                                headers: { "Retry-After": retryAfterValue },
                            }),
                        { once: true },
                    ),
                    http.get(url, () => HttpResponse.text("fetch-success", { status: 200 }), {
                        once: true,
                    }),
                );

                vi.useFakeTimers();

                const fetchPromise = sendApiRequest(() => new Request(url));

                let advancedByTime = 0;
                await vi.waitFor(() => {
                    advancedByTime += 50;

                    const allHandlersUsed =
                        mswServer.listHandlers().filter((handler) => {
                            return handler.info.header === `GET ${url}` && handler.isUsed;
                        }).length === 2;

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
                const url = getTestUrl();

                mswServer.use(
                    http.get(
                        url,
                        () =>
                            HttpResponse.text("fetch-500", {
                                status: 503,
                                headers: { "Retry-After": "@#$%" },
                            }),
                        { once: true },
                    ),
                    http.get(url, () => HttpResponse.text("fetch-success", { status: 200 }), {
                        once: true,
                    }),
                );

                const response = await sendApiRequest(() => new Request(url));

                expect.assertions(2);
                expect(response).toBeInstanceOf(Response);
                await expect(response.text()).resolves.toBe("fetch-success");
            });
        });

        test("Retries on 500 error code", async () => {
            const url = getTestUrl();
            mswServer.use(
                http.get(url, () => HttpResponse.text("fetch-500", { status: 500 }), { once: true }),
                http.get(url, () => HttpResponse.text("fetch-success", { status: 200 }), { once: true }),
            );

            const response = await sendApiRequest(() => new Request(url));

            expect.assertions(3);
            expect(response).toBeInstanceOf(Response);
            await expect(response.text()).resolves.toBe("fetch-success");
            const usedHandlers = mswServer.listHandlers().filter((handler) => {
                return handler.info.header === `GET ${url}` && handler.isUsed;
            }).length;
            expect(usedHandlers).toBe(2);
        });

        test("Retries on network errors", async () => {
            const url = getTestUrl();
            mswServer.use(
                http.get(url, () => HttpResponse.error(), { once: true }),
                http.get(url, () => HttpResponse.text("fetch-success", { status: 200 })),
            );

            const response = await sendApiRequest(() => new Request(url));

            expect.assertions(2);
            expect(response).toBeInstanceOf(Response);
            await expect(response.text()).resolves.toBe("fetch-success");
        });

        test("Can retry requests with consumable bodies", async () => {
            const url = getTestUrl();
            mswServer.use(
                http.post(url, () => HttpResponse.text("wrong-test-string", { status: 500 }), {
                    once: true,
                }),
                // Echo body
                http.post(url, async ({ request }) => new HttpResponse(request.body, { status: 200 }), {
                    once: true,
                }),
            );

            const response = await sendApiRequest(() => new Request(url, { method: "POST", body: "test-string" }));

            expect(await response.text()).toBe("test-string");
            expect.assertions(1);
        });

        test("Throws eventually even if the server keeps responding with a retryable error", async () => {
            const url = getTestUrl();
            mswServer.use(
                http.get(url, () => {
                    const error = { code: "TestError", message: "Test error" };
                    return HttpResponse.json(formatBodyError(error), {
                        status: 500,
                        headers: formatHeadersError(error),
                    });
                }),
            );

            const fetchPromise = sendApiRequest(() => new Request(url));

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
