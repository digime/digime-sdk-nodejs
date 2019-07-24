/*!
 * Copyright (c) 2009-2018 digi.me Limited. All rights reserved.
 */

import crypto from "crypto";
import { ReadStream } from "fs";
import { compressSync } from "iltorb";
import isPlainObject from "lodash.isplainobject";
import nock from "nock";
import NodeRSA from "node-rsa";
import { gzipSync } from "zlib";

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
        data = compressSync(data);
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

// tslint:disable-next-line:interface-over-type-literal
type NetworkRequestCallbackParameters = { request: unknown, interceptor: unknown, body: unknown };

// tslint:disable-next-line:interface-over-type-literal
type NetworkRequestConfig = {
    request: () => Promise<any>;
    method?: "GET" | "POST" | "PUT" | "HEAD" | "PATH" | "MERGE" | "DELETE" | "OPTIONS"
};

// Attempts to capture the next network request and returns the mocked function that caught it
const captureNetworkRequest = async ({
    request,
    method = "POST",
}: NetworkRequestConfig) => {
    const callback = jest.fn<void, [NetworkRequestCallbackParameters]>();
    const scope = nock(/.*/).intercept(/.*/, method).reply(200);

    // Request event only fires when the scope target has been hit
    scope.on("request", (req, interceptor, body) => callback({
        request: req,
        interceptor,
        body: JSON.parse(body),
    }));

    // Trigger request
    await request();

    return callback;
};

// Wrapper around nock.loadDefs which creates definitions which ignore request bodies
const loadDefinitions = (path: string): nock.NockDefinition[] => (
    nock.loadDefs(path).map((definition) => ({
        ...definition,

        // Avoid body filtering by default
        filteringRequestBody: (_body: unknown, recordedBody: unknown) => recordedBody,
    }))
);

// Same as above, but with added scope filtering
const loadScopeDefinitions = (path: string, scope: string): nock.NockDefinition[] => (
    loadDefinitions(path).filter((definition) => definition.scope === scope)
);

interface FileContentToCAFormatOptions {
    corruptHash?: boolean;
    corruptLength?: boolean;
    overrideCompression?: "no-compression" | "brotli" | "gzip";
}

const isResponsePlainObject = (value: unknown): value is nock.POJO => (
    !(value instanceof Buffer) && !(value instanceof ReadStream) && isPlainObject(value)
);

// Takes definitions of CA file responses and converts fileContent properties to the CA format
const fileContentToCAFormat = (
    definitions: nock.NockDefinition[],
    key: NodeRSA,
    {
        corruptHash = false,
        corruptLength = false,
        overrideCompression,
    }: FileContentToCAFormatOptions = {},
): nock.NockDefinition[] => (
    definitions.reduce((acc, definition) => {

        const response: unknown = definition.response;

        if (!isResponsePlainObject(response)) {
            return acc;
        }

        let fileContent: any = response.fileContent;

        if (isPlainObject(fileContent)) {
            fileContent = JSON.stringify(fileContent);
        }

        const def: nock.NockDefinition = {
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
    }, [] as nock.NockDefinition[])
);

export {
    loadDefinitions,
    loadScopeDefinitions,
    captureNetworkRequest,
    createCAData,
    fileContentToCAFormat,
};
