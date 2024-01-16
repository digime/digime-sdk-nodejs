/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { beforeAll, beforeEach, afterAll, afterEach, vi } from "vitest";
import { mswServer } from "./src/mocks/server";
import { serverJWKS } from "./src/mocks/mock-keys";

/**
 * We currently can't intercept JOSE's createRemoteJWKSet network calls as MSW can't intercept
 * the way JOSE imports http/https methods.
 *
 * So for a remote JWKS we're always creating a static local JWKSet and returning it from creaateRemoteJWKSet
 */
vi.mock("jose", async (importOriginal) => {
    const original = await importOriginal<typeof import("jose")>();
    return { ...original, createRemoteJWKSet: () => serverJWKS };
});

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
