import NodeRSA from "node-rsa";
import {PushDataToPostboxOptions} from "../../src/types";
import fs from "fs";

export const testKeyPair: NodeRSA = new NodeRSA({ b: 2048 });

export const defaultValidDataPush: PushDataToPostboxOptions = {
    applicationId: "test-application-id",
    contractId: "test-contract-id",
    redirectUri: "test-redirect-uri",
    sessionKey: "test-session-key",
    postboxId: "test-postbox-id",
    privateKey: testKeyPair.exportKey("pkcs1-private"),
    publicKey: testKeyPair.exportKey("pkcs1-public"),
    data: {
        fileData: Buffer.from(JSON.stringify("test-data")),
        fileName: "file-name",
        fileDescriptor: {
            mimeType: "mimeType",
            accounts: [],
            reference: [],
            tags: [],
        }
    }
}

export const validFileMeta = {
    "PLAIN_TEXT": {
        fileData: Buffer.from(JSON.stringify("test-data")),
        fileName: "file-name",
        fileDescriptor: {
            mimeType: "mimeType",
            accounts: [],
        }
    },
    "FILE_JSON": {
        fileData: fs.readFileSync(process.cwd() + "/fixtures/postbox/test.json"),
        fileName: "file-name",
        fileDescriptor: {
            mimeType: "text/plain",
            accounts: [],
        }
    },
    "FILE_PDF": {
        fileData: fs.readFileSync(process.cwd() + "/fixtures/postbox/test.pdf"),
        fileName: "file-name",
        fileDescriptor: {
            mimeType: "application/pdf",
            accounts: [],
        }
    },
    "FILE_JPG": {
        fileData: fs.readFileSync(process.cwd() + "/fixtures/postbox/test.jpg"),
        fileName: "file-name",
        fileDescriptor: {
            mimeType: "image/jpeg",
            accounts: [],
        }
    },
};

export const invalidFileMeta = {
    "NON_BUFFER_FILE_DATA": {
        fileData: JSON.stringify("test-data"),
        fileName: "file-name",
        fileDescriptor: {
            mimeType: "mimeType",
            accounts: [],
        }
    },
    "BASE_64_FILE_DATA": {
        fileData: fs.readFileSync(process.cwd() + "/fixtures/postbox/test.jpg").toString("base64"),
        fileName: "file-name",
        fileDescriptor: {
            mimeType: "mimeType",
            accounts: [],
        }
    },
    "MISSING_FILE_NAME": {
        fileData: fs.readFileSync(process.cwd() + "/fixtures/postbox/test.json"),
        fileDescriptor: {
            mimeType: "text/plain",
            accounts: [],
        }
    },
    "MISSING_FILE_DESCRIPTOR": {
        fileData: fs.readFileSync(process.cwd() + "/fixtures/postbox/test.pdf"),
        fileName: "file-name",
    },
};
