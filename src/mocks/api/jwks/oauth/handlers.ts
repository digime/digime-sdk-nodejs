/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { HttpResponse, http } from "msw";
import { assertAcceptsJson } from "../../../handler-utilities";
import { fromMockApiBase } from "../../../utilities";
import { mockApiInternals } from "../../../api-internals";

export const makeHandlers = (baseUrl?: string) => [
    http.get(fromMockApiBase("jwks/oauth", baseUrl), async ({ request }) => {
        assertAcceptsJson(request);

        return HttpResponse.json({
            keys: [mockApiInternals.publicKeyJwk],
        });
    }),
];

export const handlers = makeHandlers();
