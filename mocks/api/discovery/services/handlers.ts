/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { http, HttpResponse } from "msw";
import { createReadStreamWeb, fromMockApiBase } from "../../../utilities";
import { assertAcceptsJson } from "../../../handler-utilities";

export const makeHandlers = (baseUrl?: string) => [
    // Default handler
    http.get(fromMockApiBase("discovery/services", baseUrl), async ({ request }) => {
        assertAcceptsJson(request);

        if (request.headers.has("contractId")) {
            return new HttpResponse(
                createReadStreamWeb(new URL("./response-valid-with-contract-id.json", import.meta.url)),
            );
        }

        return new HttpResponse(createReadStreamWeb(new URL("./response-valid-default.json", import.meta.url)));
    }),
];

export const handlers = makeHandlers();
