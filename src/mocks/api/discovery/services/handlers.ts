/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import fs from "node:fs/promises";
import { http, HttpResponse } from "msw";
import { fromApiBase } from "../../../utilities";
import { assertAcceptsJson } from "../../../handler-utilities";

export const implementations = {
    // Default - Happy response
    default: [
        fromApiBase("discovery/services"),
        async ({ request }) => {
            assertAcceptsJson(request);

            if (request.headers.has("contractId")) {
                return HttpResponse.text(
                    await fs.readFile(new URL("./response-valid-with-contract-id.json", import.meta.url), "utf-8"),
                );
            }

            return HttpResponse.text(
                await fs.readFile(new URL("./response-valid-default.json", import.meta.url), "utf-8"),
            );
        },
    ],
} satisfies Record<string, Parameters<typeof http.all>>;

export const handlers = [http.get(...implementations.default)];
