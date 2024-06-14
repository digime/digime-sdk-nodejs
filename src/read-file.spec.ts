/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import nock from "nock";
import NodeRSA from "node-rsa";
import * as SDK from ".";
import { SAMPLE_TOKEN, TEST_CUSTOM_BASE_URL, TEST_CUSTOM_ONBOARD_URL } from "../utils/test-constants";
import { ContractDetails } from "./types/common";
import { FailableJunkStream, createTestServer, fileContentToCAFormat, loadScopeDefinitions } from "../utils/test-utils";
import { Readable } from "node:stream";

const customSDK = SDK.init({
    applicationId: "test-application-id",
    baseUrl: "http://localhost:3999/v1.7/",
    onboardUrl: TEST_CUSTOM_ONBOARD_URL,
    retryOptions: {
        errorCodes: ["ECONNRESET"],
    },
});

const testKeyPair: NodeRSA = new NodeRSA({ b: 2048 });

beforeEach(() => {
    nock.cleanAll();
});

const CONTRACT_DETAILS: ContractDetails = {
    contractId: "test-contract-id",
    privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
};

describe.each<[string, ReturnType<typeof SDK.init>, string]>([["Custom SDK", customSDK, TEST_CUSTOM_BASE_URL]])(
    "%s",
    (_title, sdk, baseUrl) => {
        it("retries when request is aborted", async () => {
            expect.assertions(1);

            let failedOnce = false;

            const server = await createTestServer(3999, (_req, res) => {
                const fileDefs = loadScopeDefinitions(
                    "fixtures/network/get-file/valid-files.json",
                    `${new URL(baseUrl).origin}`
                );

                const caFormatted = fileContentToCAFormat(fileDefs, testKeyPair);

                const responseStream = failedOnce
                    ? Readable.from(
                          caFormatted[0].response instanceof Buffer ? caFormatted[0].response : Buffer.from("test")
                      )
                    : new FailableJunkStream(10, 5);
                if (!failedOnce) {
                    failedOnce = true;
                }
                res.setHeader("Content-Type", "application/octet-stream");
                res.setHeader("x-metadata", (caFormatted[0].rawHeaders as Record<string, string>)?.["x-metadata"]);
                responseStream.on("error", () => {
                    if (res.socket) {
                        res.socket.destroy();
                    }
                });
                responseStream.pipe(res);
            });

            const sessionKey = "test-session-key";

            const fileName = "test-file";

            const promise = sdk.readFile({
                privateKey: CONTRACT_DETAILS.privateKey,
                userAccessToken: SAMPLE_TOKEN,
                sessionKey,
                contractId: CONTRACT_DETAILS.contractId,
                fileName,
            });

            await expect(promise).resolves.toMatchObject({
                fileData: expect.any(Buffer),
                fileName: expect.any(String),
            });

            server.close();
        }, 1000000);
    }
);
