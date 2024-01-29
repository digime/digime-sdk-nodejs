/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { HttpResponse, http } from "msw";
import { createReadableStream, fromMockApiBase } from "../../utilities";
import { assertAcceptsOctetStream } from "../../handler-utilities";

export const makeHandlers = (baseUrl?: string) => [
    http.get(fromMockApiBase("export/:serviceType/report", baseUrl), async ({ request }) => {
        assertAcceptsOctetStream(request);

        // TODO: Figure out how the API behaves various params

        // if (params.serviceType !== "medmij") {
        //     const error = { code: "ValidationErrors", message: "Parameter validation errors" };
        //     throw HttpResponse.json(formatBodyError(error), { status: 406, headers: formatHeadersError(error) });
        // }
        // const url = new URL(request.url);

        // if (url.searchParams.get("format") !== "xml") {
        //     const error = { code: "ValidationErrors", message: "Parameter validation errors" };
        //     throw HttpResponse.json(formatBodyError(error), { status: 406, headers: formatHeadersError(error) });
        // }
        // // TODO: Handle `from` and `to` parameters;

        return new HttpResponse(createReadableStream(new URL("./medmij-portability-report.xml", import.meta.url)));
    }),
];

export const handlers = makeHandlers();
