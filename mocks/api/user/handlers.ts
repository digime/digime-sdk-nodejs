/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { HttpResponse, http } from "msw";
import { fromMockApiBase } from "../../utilities";
import { assertBearerToken } from "../../handler-utilities";

export const makeHandlers = (baseUrl?: string) => [
    http.delete(fromMockApiBase("user", baseUrl), async ({ request }) => {
        await assertBearerToken(request);
        return new HttpResponse(undefined, { status: 204 });
    }),
];

export const handlers = makeHandlers();
