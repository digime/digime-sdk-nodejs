/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { HttpResponse, http } from "msw";
import { fromMockApiBase } from "../../../utilities";
import { assertAcceptsJson } from "../../../handler-utilities";
import { mockApiInternals } from "../../../api-internals";

const HOUR_IN_MS = 3600000;

export const makeHandlers = (baseUrl?: string) => [
    http.post(fromMockApiBase("oauth/authorize", baseUrl), async ({ request }) => {
        assertAcceptsJson(request);

        return HttpResponse.json({
            session: {
                expiry: Date.now() + HOUR_IN_MS,
                key: "test-session-key",
            },
            token: await mockApiInternals.signTokenPayload({ preauthorization_code: "test-preauthorization-code" }),
        });
    }),
];

export const handlers = makeHandlers();
