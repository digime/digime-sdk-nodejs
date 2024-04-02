/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { http, HttpResponse } from "msw";
import { createFileEncryptPipeline, createReadStreamWeb, fromMockApiBase } from "../../../utilities";
import { assertAcceptsJson, assertBearerToken, assertAcceptsOctetStream } from "../../../handler-utilities";
import { randomInt } from "node:crypto";
import { mockSdkConsumerCredentials } from "../../../sdk-consumer-credentials";
import { nodeDuplexToWeb } from "../../../../src/node-streams";
import { createBrotliCompress } from "node:zlib";
import { MOCK_SESSION_CACHE, MOCK_SESSION_CONTENT_PATH } from "../../../session/mock-session";
import { CompressionStream } from "node:stream/web";

export const makeHandlers = (baseUrl?: string) => [
    // File handler
    http.get(fromMockApiBase("permission-access/query/:sessionKey/:fileName", baseUrl), async ({ request, params }) => {
        assertAcceptsOctetStream(request);
        await assertBearerToken(request);

        const sessionKey = params.sessionKey;
        const fileName = params.fileName;

        if (typeof sessionKey !== "string") {
            throw new TypeError("Unexpected sessionKey");
        }

        if (typeof fileName !== "string") {
            throw new TypeError("Unexpected filename");
        }

        const session = MOCK_SESSION_CACHE.get(sessionKey);

        if (!session) {
            throw new TypeError("TODO: No session");
        }

        const file = session.files.find((file) => file.listEntry.name === fileName);

        if (!file) {
            throw new TypeError("TODO: No file");
        }

        let dataStream = createReadStreamWeb(new URL(file.contentPath, MOCK_SESSION_CONTENT_PATH), {
            highWaterMark: randomInt(1, 101),
        });

        // Add compression if requested
        if (file.headerXMetadata.compression === "gzip") {
            dataStream = dataStream.pipeThrough(new CompressionStream("gzip"));
        } else if (file.headerXMetadata.compression === "brotli") {
            dataStream = dataStream.pipeThrough(nodeDuplexToWeb(createBrotliCompress()));
        }

        // Get data encryption pipeline
        dataStream = createFileEncryptPipeline(mockSdkConsumerCredentials.publicKey, dataStream);

        return new HttpResponse(dataStream, {
            headers: { "x-metadata": Buffer.from(JSON.stringify(file.headerXMetadata)).toString("base64url") },
        });
    }),

    // File list handler
    http.get(fromMockApiBase("permission-access/query/:sessionKey", baseUrl), async ({ request, params }) => {
        assertAcceptsJson(request);
        await assertBearerToken(request);

        const sessionKey = params.sessionKey;

        if (typeof sessionKey !== "string") {
            throw new TypeError("Unexpected sessionKey");
        }

        const session = MOCK_SESSION_CACHE.get(sessionKey);

        if (!session) {
            throw new TypeError("TODO: No session");
        }

        // Always advance the sequence
        session.advance();

        return HttpResponse.json(session.fileList());
    }),
];

export const handlers = makeHandlers();
