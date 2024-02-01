/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

// [{"createdDate":1706789091892,"id":"19_xqonjx408hdv0e8upnvqg98an","providerFavIcon":"https://securedownloads.digi.me/static/production/discovery/services/spotify/icon25x25.png","providerLogo":"https://securedownloads.digi.me/static/production/discovery/services/spotify/icon75x75.png","reference":"f63eb0381cfcb5476e3965953552215e","serviceGroupId":5,"serviceGroupName":"Entertainment","serviceTypeId":19,"serviceTypeName":"Spotify","serviceTypeReference":"spotify","sourceId":16,"type":"USER","updatedDate":1706789123356,"username":"digi.me-test"}]

import { http, HttpResponse } from "msw";
import { fromMockApiBase } from "../../../utilities";
import { assertAcceptsJson, assertBearerToken } from "../../../handler-utilities";
import { randomUUID } from "node:crypto";

export const makeHandlers = (baseUrl?: string) => [
    // Default handler
    http.get(fromMockApiBase("permission-access/accounts", baseUrl), async ({ request }) => {
        assertAcceptsJson(request);
        await assertBearerToken(request);

        return HttpResponse.json(
            [
                {
                    createdDate: Date.now() - 10000,
                    id: `19_${randomUUID()}`,
                    providerFavIcon:
                        "https://securedownloads.digi.me/static/production/discovery/services/spotify/icon25x25.png",
                    providerLogo:
                        "https://securedownloads.digi.me/static/production/discovery/services/spotify/icon75x75.png",
                    reference: randomUUID(),
                    serviceGroupId: 5,
                    serviceGroupName: "Entertainment",
                    serviceTypeId: 19,
                    serviceTypeName: "Spotify",
                    serviceTypeReference: "spotify",
                    sourceId: 16,
                    type: "USER",
                    updatedDate: Date.now() - 10000,
                    username: "test",
                },
            ],
            { status: 200 },
        );
    }),
];

export const handlers = makeHandlers();
