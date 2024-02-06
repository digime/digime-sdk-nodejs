/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { HttpResponse, http } from "msw";
import { assertAcceptsJson, assertContentTypeJson, assertBearerToken } from "../../../handler-utilities";
import { fromMockApiBase } from "../../../utilities";
import { randomUUID } from "node:crypto";

const HOUR_IN_MS = 3600000;

export const makeHandlers = (baseUrl?: string) => [
    http.post(fromMockApiBase("permission-access/trigger", baseUrl), async ({ request }) => {
        assertAcceptsJson(request);
        assertContentTypeJson(request);
        await assertBearerToken(request);

        return HttpResponse.json({
            session: {
                expiry: Date.now() + HOUR_IN_MS,
                key: randomUUID(),
            },
        });
    }),
];

export const handlers = makeHandlers();
