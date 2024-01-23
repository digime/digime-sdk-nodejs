/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { http, HttpResponse } from "msw";
import { fromMockApiBase } from "../../../../utilities";
import { assertAcceptsJson, assertBearerToken } from "../../../../handler-utilities";

export const makeHandlers = (baseUrl?: string) => [
    // Default handler
    http.get(fromMockApiBase("permission-access/sample/datasets/:sourceId", baseUrl), async ({ request, params }) => {
        assertAcceptsJson(request);
        await assertBearerToken(request);

        return HttpResponse.json({
            default: { description: "", name: "default" },
            test: { description: "", name: "test" },
            [`mocked-${params.sourceId}`]: {
                description: `Mocked entry for sourceId: ${params.sourceId}`,
                name: `mocked-${params.sourceId}`,
            },
        });
    }),
];

export const handlers = makeHandlers();
