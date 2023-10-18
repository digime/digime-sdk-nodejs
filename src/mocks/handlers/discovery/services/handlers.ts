/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import fs from "node:fs/promises";
import { http, HttpResponse } from "msw";

const ENDPOINT_PATH = "discovery/services";
const LIVE_BASE = "https://api.digi.me/v1.7/";
// const TEST_BASE = "https://test.test.test/v0/";

export const discoveryServicesHandler = ({ path = ENDPOINT_PATH, base = LIVE_BASE } = {}) => {
    const url = new URL(path, base).toString();

    return http.get(
        url,
        // Remove `any` when this is fixed: https://github.com/mswjs/msw/issues/1691
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async ({ request }): Promise<any> => {
            const accept = request.headers.get("Accept");

            if (accept !== "application/json") {
                return discoveryServicesErrorAcceptHeaderHandler({ path, base });
            }

            return HttpResponse.text(
                await fs.readFile("./src/mocks/handlers/discovery/services/response-valid-full.json", "utf-8"),
            );
        },
        { once: true },
    );
};

export const discoveryServicesErrorAcceptHeaderHandler = ({ path = ENDPOINT_PATH, base = LIVE_BASE } = {}) => {
    const url = new URL(path, base).toString();

    return http.get(
        url,
        async () => {
            return HttpResponse.text(
                await fs.readFile("./src/mocks/handlers/discovery/services/response-error-accept-header.json", "utf-8"),
                {
                    status: 406,
                },
            );
        },
        { once: true },
    );
};

export const discoveryServicesCodeErrorHandler = ({ path = ENDPOINT_PATH, base = LIVE_BASE, errorCode = 500 } = {}) => {
    const url = new URL(path, base).toString();
    return http.get(
        url,
        () => {
            return HttpResponse.text("", { status: errorCode });
        },
        { once: true },
    );
};

export const discoveryServicesNetworkErrorHandler = ({ path = ENDPOINT_PATH, base = LIVE_BASE } = {}) => {
    const url = new URL(path, base).toString();
    return http.get(
        url,
        () => {
            return HttpResponse.error();
        },
        { once: true },
    );
};
