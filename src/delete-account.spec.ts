/*!
 * © World Data Exchange. All rights reserved.
 */

import nock from "nock";
import NodeRSA from "node-rsa";
import { URL } from "node:url";
import * as SDK from ".";
import { SAMPLE_TOKEN, TEST_BASE_URL, TEST_CUSTOM_BASE_URL, TEST_CUSTOM_ONBOARD_URL } from "../utils/test-constants";
import { ContractDetails } from "./types/common";
import { getBearerTokenErrorResponse } from "../utils/test-utils";

const digime = SDK.init({
    applicationId: "test-application-id",
});

const customSDK = SDK.init({
    applicationId: "test-application-id",
    baseUrl: TEST_CUSTOM_BASE_URL,
    onboardUrl: TEST_CUSTOM_ONBOARD_URL,
});

const testKeyPair: NodeRSA = new NodeRSA({ b: 2048 });

beforeEach(() => {
    nock.cleanAll();
});

const CONTRACT_DETAILS: ContractDetails = {
    contractId: "test-contract-id",
    privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
};

describe.each<[string, ReturnType<typeof SDK.init>, string]>([
    ["Default exported SDK", digime, TEST_BASE_URL],
    ["Custom SDK", customSDK, TEST_CUSTOM_BASE_URL],
])("%s", (_title, sdk, baseUrl) => {
    it("retries on statusCode 500", async () => {
        let failedOnce = false;
        const accountId = "test-account-id";

        nock(new URL(baseUrl).origin)
            .delete(`${new URL(baseUrl).pathname}permission-access/service/h:accountId`)
            .times(2)
            .reply(function (_uri, _body, callback) {
                const bearerTokenErrorResponse = getBearerTokenErrorResponse(
                    this.req,
                    testKeyPair.exportKey("pkcs1-public")
                );

                if (bearerTokenErrorResponse) {
                    return callback(null, bearerTokenErrorResponse);
                }

                if (!failedOnce) {
                    failedOnce = true;
                    return callback(null, [500]);
                }

                return callback(null, [201, { deleted: true, response: {} }]);
            });

        const promise = sdk.deleteAccount({
            contractDetails: CONTRACT_DETAILS,
            userAccessToken: SAMPLE_TOKEN,
            accountId,
        });

        return expect(promise).resolves.toMatchObject({ deleted: true, response: {} });
    });
});
