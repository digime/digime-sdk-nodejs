/*!
 * Copyright (c) 2009-2020 digi.me Limited. All rights reserved.
 */

import crypto from "crypto";
import { ReadStream } from "fs";
import isPlainObject from "lodash.isplainobject";
import nock from "nock";
import type { Interceptor } from "nock";
import NodeRSA from "node-rsa";
import { gzipSync, brotliCompressSync } from "zlib";
import type { ClientRequest } from "http";

interface CreateCADataOptions {
    compression?: "no-compression" | "brotli" | "gzip";
    corruptHash?: boolean;
    corruptLength?: boolean;
}

// Creates CA-like data string
const createCAData = (key: NodeRSA, inputData: string, options?: CreateCADataOptions): string => {

    const {
        compression,
        corruptHash,
        corruptLength,
    }: Required<CreateCADataOptions> = {
        compression: "no-compression",
        corruptHash: false,
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

    // Create a hash of data and concatenate
    const dataHash: crypto.Hash = crypto.createHash("sha512").update(data);

    if (corruptHash) {
        dataHash.update("test");
    }

    const hashAndData: Buffer = Buffer.concat([dataHash.digest(), data]);

    // Encrypt the hash and data
    const cipher: crypto.Cipher = crypto.createCipheriv("aes-256-cbc", dsk, div);
    const encryptedHashAndData: Buffer = Buffer.concat([cipher.update(hashAndData), cipher.final()]);

    const output: string = Buffer.concat([key.encrypt(dsk), div, encryptedHashAndData]).toString("base64");

    // Appending some data to corrupt the output
    if (corruptLength) {
        return `${output}_test`;
    }

    return output;
};

type RequestHandler = (
    mockFn: ReturnType<typeof jest.fn>,
    request: ClientRequest,
    interceptor: Interceptor,
    body: string,
) => void

interface SpyOnScopeRequestsOptions {
    requestHandler?: RequestHandler;
}

const spyOnScopeRequests = (
    scope: nock.Scope | nock.Scope[],
    options?: SpyOnScopeRequestsOptions,
) => {

    const resolvedOptions: Required<SpyOnScopeRequestsOptions> = {
        requestHandler: (mockFn, _r, _i, body) => { mockFn(JSON.parse(body)); },
        ...options,
    }

    const scopes = Array.isArray(scope) ? scope : [scope];
    const requestSpy = jest.fn();

    scopes.forEach((s) => {
        s.on("request", (request: ClientRequest, interceptor: Interceptor, body: string) => {
            resolvedOptions.requestHandler(requestSpy, request, interceptor, body);
        });
    });

    return requestSpy;
}

// Wrapper around nock.loadDefs which creates definitions which ignore request bodies
const loadDefinitions = (path: string): nock.Definition[] => (
    nock.loadDefs(path).map((definition) => ({
        ...definition,

        // Avoid body filtering by default
        filteringRequestBody: (_body: unknown, recordedBody: unknown) => recordedBody,
    }))
);

// Same as above, but with added scope filtering
const loadScopeDefinitions = (path: string, scope: string): nock.Definition[] => (
    loadDefinitions(path).filter((definition) => definition.scope === scope)
);

interface FileContentToCAFormatOptions {
    corruptHash?: boolean;
    corruptLength?: boolean;
    overrideCompression?: "no-compression" | "brotli" | "gzip";
}

const isResponsePlainObject = (value: unknown): value is Record<string, any> => (
    !(value instanceof Buffer) && !(value instanceof ReadStream) && isPlainObject(value)
);

// Takes definitions of CA file responses and converts fileContent properties to the CA format
const fileContentToCAFormat = (
    definitions: nock.Definition[],
    key: NodeRSA,
    {
        corruptHash = false,
        corruptLength = false,
        overrideCompression,
    }: FileContentToCAFormatOptions = {},
): nock.Definition[] => (
    definitions.reduce((acc, definition) => {

        const response: unknown = definition.response;

        if (!isResponsePlainObject(response)) {
            return acc;
        }

        let fileContent: any = response.fileContent;

        if (isPlainObject(fileContent)) {
            fileContent = JSON.stringify(fileContent);
        }

        const def: nock.Definition = {
            ...definition,
            response: {
                ...response,
                fileContent: createCAData(
                    key,
                    fileContent,
                    {
                        compression: overrideCompression || response.compression,
                        corruptHash,
                        corruptLength,
                    },
                ),
            },
        };
        return [...acc, def];
    }, [] as nock.Definition[])
);

export {
    loadDefinitions,
    loadScopeDefinitions,
    createCAData,
    fileContentToCAFormat,
    spyOnScopeRequests,
};
