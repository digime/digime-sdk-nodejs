/*!
 * © World Data Exchange. All rights reserved.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "node:crypto";
import isPlainObject from "lodash.isplainobject";
import get from "lodash.get";
import nock from "nock";
import type { Interceptor, ReplyHeaders } from "nock";
import NodeRSA from "node-rsa";
import { gzipSync, brotliCompressSync } from "node:zlib";
import type { ClientRequest } from "node:http";
import base64url from "base64url";
import { verify } from "jsonwebtoken";
import http, { RequestListener } from "node:http";
import { Readable } from "node:stream";

interface CreateCADataOptions {
    compression?: "no-compression" | "brotli" | "gzip";
    corruptLength?: boolean;
}

// Creates CA-like data string
const createCAData = (key: NodeRSA, inputData: string, options?: CreateCADataOptions): Buffer => {
    const { compression, corruptLength }: Required<CreateCADataOptions> = {
        compression: "no-compression",
        corruptLength: false,
        ...options,
    };

    // Create DSK and DIV
    const dsk: Buffer = crypto.randomBytes(32);
    const div: Buffer = crypto.randomBytes(16);

    let data: Buffer = Buffer.from(inputData, "utf8");

    // Perform compression if necessary
    if (compression === "brotli") {
        data = brotliCompressSync(data);
    }

    if (compression === "gzip") {
        data = gzipSync(data);
    }

    // Encrypt data
    const cipher: crypto.Cipher = crypto.createCipheriv("aes-256-cbc", dsk, div);
    const encryptedData: Buffer = Buffer.concat([cipher.update(data), cipher.final()]);

    const output: Buffer = Buffer.concat([key.encrypt(dsk), div, encryptedData]);

    // Appending some data to corrupt the output
    if (corruptLength) {
        return Buffer.concat([output, Buffer.from("extra")]);
    }

    return output;
};

type RequestHandler = (
    mockFn: ReturnType<typeof jest.fn>,
    request: ClientRequest,
    interceptor: Interceptor,
    body: string
) => void;

interface SpyOnScopeRequestsOptions {
    requestHandler?: RequestHandler;
}

const spyOnScopeRequests = (scope: nock.Scope | nock.Scope[], options?: SpyOnScopeRequestsOptions): jest.Mock => {
    const resolvedOptions: Required<SpyOnScopeRequestsOptions> = {
        requestHandler: (mockFn, _r, _i, body) => {
            mockFn(JSON.parse(body));
        },
        ...options,
    };

    const scopes = Array.isArray(scope) ? scope : [scope];
    const requestSpy = jest.fn();

    for (const s of scopes) {
        s.on("request", (request: ClientRequest, interceptor: Interceptor, body: string) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            resolvedOptions.requestHandler(requestSpy, request, interceptor, body);
        });
    }

    return requestSpy;
};

interface NockDefinitionWithHeader extends nock.Definition {
    rawHeaders?: ReplyHeaders;
}

// Wrapper around nock.loadDefs which creates definitions which ignore request bodies
const loadDefinitions = (path: string): NockDefinitionWithHeader[] =>
    nock.loadDefs(path).map((definition) => ({
        ...definition,

        // Avoid body filtering by default
        filteringRequestBody: (_body: unknown, recordedBody: unknown) => recordedBody,
    }));

// Same as above, but with added scope filtering
const loadScopeDefinitions = (path: string, scope: string): NockDefinitionWithHeader[] =>
    loadDefinitions(path).filter((definition) => definition.scope === scope);

interface FileContentToCAFormatOptions {
    corruptLength?: boolean;
    overrideCompression?: "no-compression" | "brotli" | "gzip";
}

// Takes definitions of CA file responses and converts fileContent properties to the CA format
const fileContentToCAFormat = (
    definitions: NockDefinitionWithHeader[],
    key: NodeRSA,
    { corruptLength = false, overrideCompression }: FileContentToCAFormatOptions = {}
): NockDefinitionWithHeader[] =>
    // eslint-disable-next-line unicorn/no-array-reduce
    definitions.reduce<NockDefinitionWithHeader[]>((acc, definition) => {
        const response: unknown = definition.response;

        let fileContent: any = response;

        if (isPlainObject(fileContent)) {
            fileContent = JSON.stringify(fileContent);
        }

        const headers = definition.rawHeaders;
        const compression = get(headers, ["x-metadata", "compression"]);

        const def = {
            ...definition,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            response: createCAData(key, fileContent, {
                compression: overrideCompression || compression,
                corruptLength,
            }),
            rawHeaders: {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                "x-metadata": parseMetaToHeader(get(headers, ["x-metadata"])),
            },
        };
        return [...acc, def];
    }, []);

const parseMetaToHeader = (meta: Record<string, unknown>): string => {
    return base64url.encode(JSON.stringify(meta));
};

export const formatBodyError = ({
    code,
    message,
    reference = "--MOCKED ERROR--",
}: {
    code: string;
    message: string;
    reference?: string | undefined;
}) => ({
    error: {
        code,
        message,
        reference,
    },
});

export const formatHeadersError = ({
    code,
    message,
    reference = "--MOCKED ERROR--",
}: {
    code: string;
    message: string;
    reference?: string | undefined;
}) => ({
    "X-Error-Code": code,
    "X-Error-Message": message,
    "X-Error-Reference": reference,
});

/**
 * Cache for nonces within the bearer tokens
 */
const seenNonces = new Set();

/**
 * Mimics the way Digi.me API handles the request with an invalid Authorization header
 */
const getBearerTokenErrorResponse = (
    request: nock.ReplyFnContext["req"],
    publicKey: string
): undefined | nock.ReplyFnResult => {
    const authorization = request.headers["authorization"] as unknown;
    const error = { code: "ValidationErrors", message: "Parameter validation errors" };
    const bodyError = formatBodyError(error);
    const headersError = formatHeadersError(error);

    if (!authorization || typeof authorization !== "string") {
        //ReplyFnResult
        return [406, bodyError, headersError];
    }

    const [type, token] = authorization.split(" ");

    if (!type || !token) {
        return [406, bodyError, headersError];
    }

    // Verify signature
    let payload;
    try {
        payload = verify(token, publicKey);
    } catch {
        return [406, bodyError, headersError];
    }

    if (typeof payload === "string") {
        return [400]; //TODO
    }

    const nonce: unknown = payload.nonce;

    if (typeof nonce !== "string") {
        return [400]; //TODO
    }

    if (nonce) {
        if (seenNonces.has(nonce)) {
            const nonceError = {
                code: "InvalidRequest",
                message: `The nonce provided in JWT payload (${nonce}) has already been used`,
            };
            return [406, formatBodyError(nonceError), formatHeadersError(nonceError)];
        } else {
            seenNonces.add(nonce);
        }
    }
    return undefined;
};

const createTestServer = async (port: number, requestListener: RequestListener) => {
    let resolve: (value?: unknown) => void;
    const serverListening = new Promise((res) => {
        resolve = res;
    });
    const server = http.createServer(requestListener);

    server.listen(port, "localhost", () => {
        resolve();
    });

    await serverListening;

    return server;
};

class FailableJunkStream extends Readable {
    private index: number;
    constructor(
        private chunks: number,
        private failAfter: number = -1,
        options = {}
    ) {
        super(options);
        this.index = 0;
    }

    _read() {
        if (this.index === this.failAfter) {
            this.destroy(new Error(`Something went wrong! ${String(this.index)}`));
            return;
        } else if (this.index <= this.chunks) {
            const chunk = `Junk ${String(this.index++)}\n`;
            this.push(chunk);
        } else {
            this.push(null);
        }
    }
}

export {
    loadDefinitions,
    loadScopeDefinitions,
    createCAData,
    fileContentToCAFormat,
    spyOnScopeRequests,
    parseMetaToHeader,
    getBearerTokenErrorResponse,
    createTestServer,
    FailableJunkStream,
};
