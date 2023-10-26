/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { describe, test, expect, vi } from "vitest";
import { mswServer } from "../mocks/server";
import { fetch } from "./fetch";
import { HttpResponse, http } from "msw";
import { randomUUID } from "node:crypto";

describe("fetch", () => {
    test("Returns response on success", async () => {
        mswServer.use(http.get("https://fetch.test/", () => HttpResponse.text("fetch-success", { status: 200 })));

        const response = await fetch("https://fetch.test/");

        expect(response).toBeInstanceOf(Response);
        expect(response.text()).resolves.toBe("fetch-success");
        expect.assertions(2);
    });

    test("Retries on 500 error code", async () => {
        mswServer.use(
            http.get("https://fetch.test/", () => HttpResponse.text("fetch-500", { status: 500 }), { once: true }),
            http.get("https://fetch.test/", () => HttpResponse.text("fetch-success", { status: 200 }), { once: true }),
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

    // TODO: Improve
    test.skip("Throw errors with causes on unretryable code", async () => {
        mswServer.use(http.get("https://fetch.test/", () => HttpResponse.text("{{{", { status: 409 }), { once: true }));

        const response = fetch("https://fetch.test/");

        await expect(response).rejects.toThrowError(Error);
        await expect(response).rejects.toThrowError("Network request failed");
        await expect(response).rejects.toMatchObject({
            cause: expect.objectContaining({
                message: expect.stringContaining("Received unexpected response from the API"),
                cause: expect.objectContaining({
                    name: expect.stringContaining("ZodError"),
                }),
            }),
        });

        expect.assertions(3);
    });

    test("Can retry requests with consumable bodies", async () => {
        mswServer.use(
            http.post("https://fetch.test/", () => HttpResponse.text("wrong-test-string", { status: 500 }), {
                once: true,
            }),
            // Echo body
            http.post("https://fetch.test/", async ({ request }) => new HttpResponse(request.body, { status: 200 }), {
                once: true,
            }),
        );

        const response = await fetch("https://fetch.test/", { method: "POST", body: "test-string" });

        expect(await response.text()).toBe("test-string");
        expect.assertions(1);
    });
});
