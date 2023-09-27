/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import fs from "node:fs/promises";
import { http, HttpResponse } from "msw";

const actualURL = new URL("discovery/services", "https://api.digi.me/v1.7/");
// const testURL = new URL("discovery/services", "https://test.test.test/v0/");

export const discoveryServicesHandler = (url = actualURL) => {
    // Remove `any` when this is fixed: https://github.com/mswjs/msw/issues/1691
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return http.get(url.toString(), async ({ request }): Promise<any> => {
        const accept = request.headers.get("Accept");

        if (accept !== "application/json") {
            return HttpResponse.text(
                await fs.readFile("./src/mocks/handlers/discovery/services/response-error-accept-header.json", "utf-8"),
                {
                    status: 406,
                },
            );
        }

        return HttpResponse.text(
            await fs.readFile("./src/mocks/handlers/discovery/services/response-valid-full.json", "utf-8"),
        );
    });
};
