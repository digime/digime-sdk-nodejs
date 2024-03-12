/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { http, HttpResponse } from "msw";
import { createFileEncryptPipeline, createReadableStream, fromMockApiBase } from "../../../utilities";
import { assertAcceptsJson, assertBearerToken, assertAcceptsOctetStream } from "../../../handler-utilities";
import { randomInt, randomUUID } from "node:crypto";
import { mockSdkConsumerCredentials } from "../../../sdk-consumer-credentials";
import { nodeDuplexToWeb } from "../../../../src/node-streams";
import { createBrotliCompress } from "node:zlib";

const availableFiles = {
    "test-image.png": {
        name: "test-image.png",
        headerMetadata: {
            metadata: {
                accounts: [{ accountid: "test" }],
                created: Math.round(Date.now() / 1000),
                contractid: "test-contract-id",
                mimetype: "image/png",
                objecttypes: [],
                appid: "test-app-id",
                partnerid: "test-partner-id",
                hash: "4948fdb6cc724ae447324fe57b51d9e1",
            },
            size: 90688,
        },
        fileListEntry: {
            name: `test-image.png`,
            updatedDate: Math.round(Date.now() / 1000),
        },
    },

    "test-mapped-file.json": {
        name: "test-mapped-file.json",
        headerMetadata: {
            metadata: {
                objectCount: 26,
                objectType: "followedartist",
                objectVersion: "1.0.0",
                schema: { standard: "digime", version: "1.0.0" },
                serviceGroup: "entertainment",
                serviceName: "spotify",
            },
            size: 25565,
        },
        fileListEntry: {
            name: `test-mapped-file.json`,
            objectVersion: "1.0.0",
            schema: { standard: "digime", version: "1.0.0" },
            updatedDate: Math.round(Date.now() / 1000),
        },
    },
} as const;

export const makeHandlers = (compression?: "gzip" | "brotli", baseUrl?: string) => [
    // File handler
    http.get(fromMockApiBase("permission-access/query/:sessionKey/:fileName", baseUrl), async ({ request, params }) => {
        assertAcceptsOctetStream(request);
        await assertBearerToken(request);

        const fileName = params.fileName;

        if (typeof fileName !== "string") {
            throw new TypeError("Unexpected filename");
        }

        const targetFile = fileName.endsWith(".png")
            ? availableFiles["test-image.png"]
            : availableFiles["test-mapped-file.json"];

        // Create metadata
        const metadata: Record<string, unknown> = {
            ...targetFile.headerMetadata,
        };

        // Add compression metadata
        if (compression) {
            metadata.compression = compression;
        }

        let dataStream = createReadableStream(new URL(targetFile.name, import.meta.url), {
            highWaterMark: randomInt(1, 101),
        });

        // Add compression if requested
        if (compression === "gzip") {
            dataStream = dataStream.pipeThrough(new CompressionStream("gzip"));
        } else if (compression === "brotli") {
            dataStream = dataStream.pipeThrough(nodeDuplexToWeb(createBrotliCompress()));
        }

        // Get data encryption pipeline
        dataStream = createFileEncryptPipeline(mockSdkConsumerCredentials.publicKey, dataStream);

        return new HttpResponse(dataStream, {
            headers: { "x-metadata": Buffer.from(JSON.stringify(metadata)).toString("base64url") },
        });
    }),

    // File list handler
    http.get(fromMockApiBase("permission-access/query/:sessionKey", baseUrl), async ({ request }) => {
        assertAcceptsJson(request);
        await assertBearerToken(request);

        const fileCount = randomInt(1, 10);
        const fileList = [];

        for (let index = 0; index < fileCount; index++) {
            fileList.push({
                name: `${randomUUID()}.json`,
                objectVersion: "1.0.0",
                schema: { standard: "digime", version: "1.0.0" },
                updatedDate: Math.round(Date.now() / 1000),
            });
        }

        return HttpResponse.json({
            status: {
                details: {
                    [`19_${randomUUID()}`]: {
                        state: "completed",
                    },
                },
                state: "completed",
            },
            fileList,
        });
    }),
];

export const handlers = makeHandlers();
