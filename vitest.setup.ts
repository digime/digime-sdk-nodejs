/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { beforeAll, afterAll, afterEach } from "vitest";
import { mswServer } from "./src/mocks/server";

beforeAll(() =>
    mswServer.listen({
        onUnhandledRequest: (request, print) => {
            if (request.url.includes("intentionally-unhandled")) {
                return;
            }

            print.warning();
        },
    }),
);
afterAll(() => mswServer.close());
afterEach(() => mswServer.resetHandlers());
