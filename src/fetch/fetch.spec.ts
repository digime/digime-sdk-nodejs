/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { describe, test, expect, vi } from "vitest";
import { mswServer } from "../mocks/server";
import { fetch } from "./fetch";
import { HttpResponse, http } from "msw";
import { randomUUID } from "node:crypto";
import { DigiMeSdkApiError } from "../errors/errors";
import { formatBodyError, formatHeadersError } from "../mocks/utilities";

describe("fetch", () => {
    test("Returns response on success", async () => {
        mswServer.use(http.get("https://fetch.test/", () => HttpResponse.text("fetch-success", { status: 200 })));

        const response = await fetch("https://fetch.test/");

        expect(response).toBeInstanceOf(Response);
        expect(response.text()).resolves.toBe("fetch-success");
        expect.assertions(2);
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

            expect(fetchPromise).rejects.toBeInstanceOf(Error);
            expect(fetchPromise).rejects.toBeInstanceOf(DigiMeSdkApiError);
            expect(fetchPromise).rejects.toMatchInlineSnapshot(`
                  [DigiMeSdkApiError: Digi.me API responded with the following error:
                   • Code: TestError
                   • Message: Test error
                   • Reference: --MOCKED ERROR--]
                `);

            expect.assertions(3);
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

            // TODO: Spec error
            // expect(fetchPromise).rejects.toThrowError(Error);
            // expect(fetchPromise).rejects.toThrowError(DigiMeSdkError);
            expect(fetchPromise).rejects.toThrowErrorMatchingInlineSnapshot(`undefined`);
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
                    throw new Error("All handlers still unused");
                }
            });

            const response = await fetchPromise;

            vi.useRealTimers();

            expect(advancedByTime).toBeGreaterThanOrEqual(secondsToWait * 1000);
            expect(fetchPromise).resolves.toBeInstanceOf(Response);
            expect(response.text()).resolves.toBe("fetch-success");
        });

        test("Retries on 500 error code", async () => {
            mswServer.use(
                http.get("https://fetch.test/", () => HttpResponse.text("fetch-500", { status: 500 }), { once: true }),
                http.get("https://fetch.test/", () => HttpResponse.text("fetch-success", { status: 200 }), {
                    once: true,
                }),
            );

            const response = await fetch("https://fetch.test/");

            expect(response).toBeInstanceOf(Response);
            expect(response.text()).resolves.toBe("fetch-success");
            expect(mswServer.listHandlers()).toMatchObject([{ isUsed: true }, { isUsed: true }]);
            expect.assertions(3);
        });

        test("Retries on ENOTFOUND network error", async () => {
            // Alter the base to try and force the ENOTFOUND the network request
            const url = `https://intentionally-unhandled.${randomUUID()}/`;
            const handlerTracker = vi.fn();

            const unhandledRequestHandler = () => {
                handlerTracker();

                if (handlerTracker.mock.calls.length >= 2) {
                    mswServer.use(http.get(url, () => HttpResponse.text("fetch-success", { status: 200 })));
                }
            };
            const emitter = mswServer.events.on("request:unhandled", unhandledRequestHandler);

            const response = await fetch(url);

            expect(response).toBeInstanceOf(Response);
            expect(response.text()).resolves.toBe("fetch-success");
            expect(handlerTracker).toHaveBeenCalledTimes(2);

            // Clean up and ensure listener was removed
            mswServer.events.removeListener("request:unhandled", unhandledRequestHandler);
            expect(emitter.listenerCount("request:unhandled")).toBe(0);

            expect.assertions(4);
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
