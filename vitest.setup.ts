/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { beforeAll, beforeEach, afterAll, afterEach, vi } from "vitest";
import { mswServer } from "./src/mocks/server";

/**
 * We're mocking `jose`'s internal fetch_jwks implementation as the wildcard ESM imports
 * are bypassing MSW interceptors for those requests, so we're replacing it with a replica.
 */
vi.mock("./node_modules/jose/dist/node/esm/runtime/fetch_jwks.js", async () => ({
    default: (await import("./src/mocks/jose/fetch-jwks")).fetchJwks,
}));

beforeAll(() => {
    mswServer.listen({
        onUnhandledRequest: "error",
    });
});

afterAll(() => {
    mswServer.close();
});

beforeEach(() => {
    vi.useRealTimers();
});

afterEach(() => {
    mswServer.resetHandlers();
});
