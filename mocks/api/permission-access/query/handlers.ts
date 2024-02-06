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

export const makeHandlers = (baseUrl?: string) => [
    // File handler
    http.get(fromMockApiBase("permission-access/query/:sessionKey/:fileName", baseUrl), async ({ request }) => {
        assertAcceptsOctetStream(request);
        await assertBearerToken(request);

        const metadata = JSON.stringify({
            metadata: {
                objectCount: 66,
                objectType: "followedartist",
                objectVersion: "1.0.0",
                schema: { standard: "digime", version: "1.0.0" },
                serviceGroup: "entertainment",
                serviceName: "spotify",
            },
            size: 62688,
        });

        const transformStream = new TransformStream();
        const { encryptedKey, iv, cipherivTransform } = createFileEncryptTransformStream(
            mockSdkConsumerCredentials.publicKey,
        );

        const writer = transformStream.writable.getWriter();
        writer.write(encryptedKey);
        writer.write(iv);
        writer.releaseLock();

        const fileReadable = createReadableStream(new URL("./test-mapped-file.json", import.meta.url));

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
