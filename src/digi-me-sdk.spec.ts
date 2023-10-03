/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { DigiMeSDK } from "./index";
import { mswServer } from "./mocks/server";
import { discoveryServicesHandler } from "./mocks/handlers/discovery/services/handlers";
describe("DigiMeSDK", () => {
    describe("getAvailableServices", () => {
        test("Runs", async () => {
            mswServer.use(discoveryServicesHandler());

            const sdk = new DigiMeSDK({ applicationId: "test-application-id" });

            const services = await sdk.getAvailableServices();

            expect(services).toMatchObject({
                countries: expect.anything(),
                services: expect.anything(),
                serviceGroups: expect.anything(),
            });
        });
    });
});
