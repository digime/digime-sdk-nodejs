/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import NodeRSA from "node-rsa";
import fs from "fs";
import { WriteOptions } from "../../src/write";
import { ContractDetails } from "../../src/types/common";
import { SAMPLE_TOKEN } from "../../utils/test-constants";

export const testKeyPair: NodeRSA = new NodeRSA({ b: 2048 });

const CONTRACT_DETAILS: ContractDetails = {
    contractId: "test-contract-id",
    redirectUri: "test-redirect-url",
    privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
};

export const defaultValidDataPush: WriteOptions = {
    contractDetails: CONTRACT_DETAILS,
    postboxId: "test-postbox-id",
    publicKey: testKeyPair.exportKey("pkcs1-public"),
    userAccessToken: SAMPLE_TOKEN,
    data: {
        fileData: Buffer.from(JSON.stringify("test-data")),
        fileName: "file-name",
        fileDescriptor: {
            mimeType: "mimeType",
            accounts: [],
            reference: [],
            tags: [],
        },
    },
};

export const validFileMeta = {
    PLAIN_TEXT: {
        fileData: Buffer.from(JSON.stringify("test-data")),
        fileName: "file-name",
        fileDescriptor: {
            mimeType: "mimeType",
            accounts: [],
        },
    },
    FILE_JSON: {
        fileData: fs.readFileSync(process.cwd() + "/fixtures/postbox/test.json"),
        fileName: "file-name",
        fileDescriptor: {
            mimeType: "text/plain",
            accounts: [],
        },
    },
    FILE_PDF: {
        fileData: fs.readFileSync(process.cwd() + "/fixtures/postbox/test.pdf"),
        fileName: "file-name",
        fileDescriptor: {
            mimeType: "application/pdf",
            accounts: [],
        },
    },
    FILE_JPG: {
        fileData: fs.readFileSync(process.cwd() + "/fixtures/postbox/test.jpg"),
        fileName: "file-name",
        fileDescriptor: {
            mimeType: "image/jpeg",
            accounts: [],
        },
    },
};

export const invalidFileMeta = {
    NON_BUFFER_FILE_DATA: {
        fileData: JSON.stringify("test-data"),
        fileName: "file-name",
        fileDescriptor: {
            mimeType: "mimeType",
            accounts: [],
        },
    },
    BASE_64_FILE_DATA: {
        fileData: fs.readFileSync(process.cwd() + "/fixtures/postbox/test.jpg").toString("base64"),
        fileName: "file-name",
        fileDescriptor: {
            mimeType: "mimeType",
            accounts: [],
        },
    },
    MISSING_FILE_NAME: {
        fileData: fs.readFileSync(process.cwd() + "/fixtures/postbox/test.json"),
        fileDescriptor: {
            mimeType: "text/plain",
            accounts: [],
        },
    },
    MISSING_FILE_DESCRIPTOR: {
        fileData: fs.readFileSync(process.cwd() + "/fixtures/postbox/test.pdf"),
        fileName: "file-name",
    },
};
