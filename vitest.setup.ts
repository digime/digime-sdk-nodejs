/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { beforeAll, beforeEach, afterAll, afterEach, vi } from "vitest";
import { mswServer } from "./src/mocks/server";

beforeAll(() =>
    mswServer.listen({
        onUnhandledRequest: "error",
    }),
);

afterAll(() => {
    mswServer.close();
});

beforeEach(() => {
    vi.useRealTimers();
});

afterEach(() => {
    mswServer.resetHandlers();
});
