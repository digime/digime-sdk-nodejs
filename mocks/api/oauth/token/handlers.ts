/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { HttpResponse, http } from "msw";
import { assertAcceptsJson, assertBearerToken } from "../../../handler-utilities";
import { fromMockApiBase } from "../../../utilities";
import { mockApiInternals } from "../../../api-internals";

export const makeHandlers = (baseUrl?: string) => [
    http.post(fromMockApiBase("oauth/token", baseUrl), async ({ request }) => {
        assertAcceptsJson(request);
        await assertBearerToken(request);

        return HttpResponse.json({
            token: await mockApiInternals.generateUserAuthorizationJwt(),
        });
    }),
];

export const handlers = makeHandlers();
