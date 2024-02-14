/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { http, HttpResponse } from "msw";
import { createFileEncryptTransformStream, createReadableStream, fromMockApiBase } from "../../../utilities";
import { assertAcceptsJson, assertBearerToken, assertAcceptsOctetStream } from "../../../handler-utilities";
import { randomInt, randomUUID } from "node:crypto";
import { mockSdkConsumerCredentials } from "../../../sdk-consumer-credentials";

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

export const makeHandlers = (baseUrl?: string) => [
    // File handler
    http.get(fromMockApiBase("permission-access/query/:sessionKey/:fileName", baseUrl), async ({ request, params }) => {
        assertAcceptsOctetStream(request);
        await assertBearerToken(request);

        const fileName = params.fileName;

        if (typeof fileName !== "string") {
            console.log("Handler error");
            throw new TypeError("Unexpected filename");
        }

        const targetFile = fileName.endsWith(".png")
            ? availableFiles["test-image.png"]
            : availableFiles["test-mapped-file.json"];

        // Get data encryption transformer
        const { encryptedKey, iv, cipherivTransform } = createFileEncryptTransformStream(
            mockSdkConsumerCredentials.publicKey,
        );

        // Write pre-data contents
        const transformStream = new TransformStream();
        const writer = transformStream.writable.getWriter();
        writer.write(encryptedKey);
        writer.write(iv);
        writer.releaseLock();

        // Create metadata
        const metadata = JSON.stringify(targetFile.headerMetadata);

        const fileReadable = createReadableStream(new URL(targetFile.name, import.meta.url), {
            highWaterMark: randomInt(1, 101),
        });

        fileReadable.pipeThrough(cipherivTransform).pipeTo(transformStream.writable);

        return new HttpResponse(transformStream.readable, {
            headers: { "x-metadata": Buffer.from(metadata).toString("base64url") },
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
