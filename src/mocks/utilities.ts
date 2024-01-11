/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { randomUUID } from "node:crypto";

export const fromApiBase = (path: string): string => new URL(path, "https://api.digi.me/v1.7/").toString();

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
