/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { DigiMeSDK } from "./index";
import { mswServer } from "./mocks/server";
import { discoveryServicesHandler } from "./mocks/handlers/discovery/services/handlers";
describe("DigiMeSDK", () => {
    describe("getAvailableServices", () => {
        test("Runs", async () => {
            // const url = new URL("discovery/services", "https://api.digi.me/v1.7/");

            mswServer.use(
                discoveryServicesHandler(),
                // // Remove `any` when this is fixed: https://github.com/mswjs/msw/issues/1691
                // // eslint-disable-next-line @typescript-eslint/no-explicit-any
                // http.get(url.toString(), ({ request }): any => {
                //     const accept = request.headers.get("Accept");

                //     if (accept !== "application/json") {
                //         return HttpResponse.json(
                //             {
                //                 error: {
                //                     code: "ValidationErrors",
                //                     message: "Parameter validation errors",
                //                     reference: "THIS IS A MOCKED ERROR",
                //                 },
                //             },
                //             { status: 406 },
                //         );
                //     }

                //     return HttpResponse.json({ data: { countries: [], services: [], serviceGroups: [] } });
                // }),
            );

            const sdk = new DigiMeSDK();

            const services = await sdk.getAvailableServices();

            expect(services).toMatchObject({
                countries: expect.anything(),
                services: expect.anything(),
                serviceGroups: expect.anything(),
            });
        });
    });
});
