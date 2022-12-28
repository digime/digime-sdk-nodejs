/*!
 * Copyright (c) 2009-2022 digi.me Limited. All rights reserved.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "crypto";
import isPlainObject from "lodash.isplainobject";
import get from "lodash.get";
import nock from "nock";
import type { Interceptor, ReplyHeaders } from "nock";
import NodeRSA from "node-rsa";
import { gzipSync, brotliCompressSync } from "zlib";
import type { ClientRequest } from "http";
import base64url from "base64url";

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

const spyOnScopeRequests = (
    scope: nock.Scope | nock.Scope[],
    options?: SpyOnScopeRequestsOptions
): jest.Mock<any, any> => {
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
    definitions.reduce((acc, definition) => {
        const response: unknown = definition.response;

        let fileContent: any = response;

        if (isPlainObject(fileContent)) {
            fileContent = JSON.stringify(fileContent);
        }

        const headers = definition.rawHeaders;
        const compression = get(headers, ["x-metadata", "compression"]);

        const def = {
            ...definition,
            response: createCAData(key, fileContent, {
                compression: overrideCompression || compression,
                corruptLength,
            }),
            rawHeaders: {
                "x-metadata": parseMetaToHeader(get(headers, ["x-metadata"])),
            },
        };
        return [...acc, def];
    }, [] as NockDefinitionWithHeader[]);

const parseMetaToHeader = (meta: Record<string, unknown>): string => {
    return base64url.encode(JSON.stringify(meta));
};

export {
    loadDefinitions,
    loadScopeDefinitions,
    createCAData,
    fileContentToCAFormat,
    spyOnScopeRequests,
    parseMetaToHeader,
};
