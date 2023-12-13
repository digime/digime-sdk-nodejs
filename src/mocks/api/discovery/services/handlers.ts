/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import fs from "node:fs/promises";
import { http, HttpResponse } from "msw";
import { formatBodyError, formatHeadersError, fromApiBase } from "../../../utilities";

export const implementations = {
    // Default - Happy response
    default: [
        fromApiBase("discovery/services"),
        // Remove `any` when this is fixed: https://github.com/mswjs/msw/issues/1691
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async ({ request }): Promise<any> => {
            const accept = request.headers.get("Accept");

            if (accept !== "application/json") {
                const error = { code: "ValidationErrors", message: "Parameter validation errors" };
                return HttpResponse.json(formatBodyError(error), { status: 406, headers: formatHeadersError(error) });
            }

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
