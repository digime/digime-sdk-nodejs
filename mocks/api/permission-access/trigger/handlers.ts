/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { HttpResponse, http } from "msw";
import { assertAcceptsJson, assertContentTypeJson, assertBearerToken } from "../../../handler-utilities";
import { fromMockApiBase } from "../../../utilities";
import { randomUUID } from "node:crypto";
import { MockSession } from "../../../session/mock-session";

export const makeHandlers = (baseUrl?: string) => [
    http.post(fromMockApiBase("permission-access/trigger", baseUrl), async ({ request }) => {
        assertAcceptsJson(request);
        assertContentTypeJson(request);
        await assertBearerToken(request);

        const session = new MockSession({
            sessionKey: randomUUID(),
        }).advance();

        return HttpResponse.json({
            session: {
                expiry: session.expiry,
                key: session.sessionKey,
            },
        });
    }),
];

export const handlers = makeHandlers();
