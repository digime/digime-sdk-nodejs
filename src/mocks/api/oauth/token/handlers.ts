/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { HttpResponse, http } from "msw";
import { assertAcceptsJson, assertBearerToken } from "../../../handler-utilities";
import { fromMockApiBase } from "../../../utilities";
import { mockApiInternals } from "../../../api-internals";

const HOUR_IN_MS = 3600000;
const DAY_IN_MS = HOUR_IN_MS * 24;

export const makeHandlers = (baseUrl?: string) => [
    http.post(fromMockApiBase("oauth/token", baseUrl), async ({ request }) => {
        assertAcceptsJson(request);
        await assertBearerToken(request);

        return HttpResponse.json({
            token: await mockApiInternals.signTokenPayload({
                access_token: {
                    expires_on: (Date.now() + HOUR_IN_MS) * 1000,
                    value: "mock-access-token-value",
                },
                consentid: "mock-consent-id",
                identifier: {
                    id: "mock-identifier-id",
                },
                refresh_token: {
                    expires_on: (Date.now() + DAY_IN_MS) * 1000,
                    value: "mock-refresh-token-value",
                },
                sub: "mock-sub",
                token_type: "Bearer",
            }),
        });
    }),
];

export const handlers = makeHandlers();
