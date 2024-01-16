/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { HttpResponse, http } from "msw";
import { fromApiBase } from "../../../utilities";
import { assertAcceptsJson } from "../../../handler-utilities";
import { mockApiInternals } from "../../../api-internals";

const HOUR_IN_MS = 3600000;

export const implementations = {
    default: [
        fromApiBase("oauth/authorize"),
        async ({ request }) => {
            assertAcceptsJson(request);

            return HttpResponse.json({
                session: {
                    expiry: Date.now() + HOUR_IN_MS,
                    key: "test-session-key",
                },
                token: await mockApiInternals.signTokenPayload({ preauthorization_code: "test-preauthorization-code" }),
            });
        },
    ],
} satisfies Record<string, Parameters<typeof http.all>>;

export const handlers = [http.post(...implementations.default)];
