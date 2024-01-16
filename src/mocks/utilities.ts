/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { Readable } from "node:stream";

const DEFAULT_MOCK_API_BASE_URL = "https://api.digi.me/v1.7/";

export const fromMockApiBase = (path: string, base: string = DEFAULT_MOCK_API_BASE_URL): string =>
    new URL(path, base).toString();

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

export const getTestUrl = (...parts: string[]): string => `https://${[...parts, randomUUID()].join(".")}.test`;

export const createReadableStream = (...args: Parameters<typeof fs.createReadStream>): ReadableStream => {
    return Readable.toWeb(fs.createReadStream(...args)) as ReadableStream;
};
