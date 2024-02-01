/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { http, HttpResponse } from "msw";
import { fromMockApiBase } from "../../../utilities";
import { assertAcceptsJson, assertBearerToken } from "../../../handler-utilities";
import { randomInt, randomUUID } from "node:crypto";

export const makeHandlers = (baseUrl?: string) => [
    // Default handler
    http.get(fromMockApiBase("permission-access/query/:sessionKey", baseUrl), async ({ request }) => {
        assertAcceptsJson(request);
        await assertBearerToken(request);

        const fileCount = randomInt(1, 10);
        const fileList = [];

        for (let index = 0; index < fileCount; index++) {
            fileList.push({
                name: `${randomUUID()}.json`,
                objectVersion: "1.0.0",
                schema: { standard: "digime", version: "1.0.0" },
                updatedDate: Math.round(Date.now() / 1000),
            });
        }

        return HttpResponse.json({
            status: {
                details: {
                    [`19_${randomUUID()}`]: {
                        state: "completed",
                    },
                },
                state: "completed",
            },
            fileList,
        });
    }),
];

export const handlers = makeHandlers();
