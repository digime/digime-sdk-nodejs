/*!
 * © World Data Exchange. All rights reserved.
 */

import NodeRSA from "node-rsa";
import fs from "node:fs";
import { PushDataOptions } from "../../src/push";
import { ContractDetails } from "../../src/types/common";
import { SAMPLE_TOKEN } from "../../utils/test-constants";

export const testKeyPair: NodeRSA = new NodeRSA({ b: 2048 });

const CONTRACT_DETAILS: ContractDetails = {
    contractId: "test-contract-id",
    privateKey: testKeyPair.exportKey("pkcs1-private-pem").toString(),
};

export const defaultValidDataPush: PushDataOptions = {
    type: "library",
    contractDetails: CONTRACT_DETAILS,
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
        fileData: fs.readFileSync(process.cwd() + "/fixtures/write/test.json"),
        fileName: "file-name",
        fileDescriptor: {
            mimeType: "text/plain",
            accounts: [],
        },
    },
    FILE_PDF: {
        fileData: fs.readFileSync(process.cwd() + "/fixtures/write/test.pdf"),
        fileName: "file-name",
        fileDescriptor: {
            mimeType: "application/pdf",
            accounts: [],
        },
    },
    FILE_JPG: {
        fileData: fs.readFileSync(process.cwd() + "/fixtures/write/test.jpg"),
        fileName: "file-name",
        fileDescriptor: {
            mimeType: "image/jpeg",
            accounts: [],
        },
    },
};

const validFileMetaStreamData = {
    PLAIN_TEXT: [process.cwd() + "/fixtures/write/test.txt", "text/plain"],
    FILE_JSON: [process.cwd() + "/fixtures/write/test.json", "text/plain"],
    FILE_PDF: [process.cwd() + "/fixtures/write/test.pdf", "application/pdf"],
    FILE_JPG: [process.cwd() + "/fixtures/write/test.jpg", "image/jpeg"],
} as const;

export const validFileMetaStream = (type: keyof typeof validFileMetaStreamData) => {
    const [path, mimeType] = validFileMetaStreamData[type];
    return {
        fileData: fs.createReadStream(path),
        fileName: "file-name",
        fileDescriptor: {
            mimeType,
            accounts: [],
        },
    };
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
        fileData: fs.readFileSync(process.cwd() + "/fixtures/write/test.jpg").toString("base64"),
        fileName: "file-name",
        fileDescriptor: {
            mimeType: "mimeType",
            accounts: [],
        },
    },
    MISSING_FILE_NAME: {
        fileData: fs.readFileSync(process.cwd() + "/fixtures/write/test.json"),
        fileDescriptor: {
            mimeType: "text/plain",
            accounts: [],
        },
    },
    MISSING_FILE_DESCRIPTOR: {
        fileData: fs.readFileSync(process.cwd() + "/fixtures/write/test.pdf"),
        fileName: "file-name",
    },
};
