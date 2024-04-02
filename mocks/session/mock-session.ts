/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { LRUCache } from "lru-cache";
import type { SessionFileList } from "../../src/schemas/api/session/session-file-list";
import { randomInt, randomUUID } from "node:crypto";

const HOUR_IN_MS = 3600000;

export const MOCK_SESSION_CACHE = new LRUCache<string, MockSession>({
    max: 1000,
});

export const MOCK_SESSION_CONTENT_PATH = new URL("content/", import.meta.url).toString();

type SessionUpdater = (mockSession: MockSession) => void;

interface MockSessionConstructorOptions {
    /** Session's `sessionKey` */
    sessionKey: string;
    /** Session's expiry timestamp */
    expiry?: number;
    /** Array of session updaters that will be called in sequence by `.advance()` */
    updateSequence?: SessionUpdater[];
}

interface MockSessionFile {
    /** This file's representation in the `SessionFileList` */
    listEntry: NonNullable<SessionFileList["fileList"]>[number];
    /** Metadata sent in the `X-Metadata` header of the file */
    headerXMetadata: Record<string, unknown>; // TODO: Metadata type
    /** File path relative to the `content` directory */
    contentPath: string;
}

export class MockSession {
    #sessionKey: string;
    #expiry: number;
    #state: SessionFileList["status"]["state"] = "pending";
    #files: MockSessionFile[] = [];
    #updateSequence: NonNullable<MockSessionConstructorOptions["updateSequence"]> = [
        () => {}, // No change on the first step
        (mockSession) => {
            mockSession.addMappedFile();
        },
    ];

    constructor({ sessionKey, expiry, updateSequence }: MockSessionConstructorOptions) {
        this.#sessionKey = sessionKey;
        this.#expiry = expiry ?? Date.now() + HOUR_IN_MS;

        const ttl = this.#expiry - Date.now();

        if (updateSequence) this.#updateSequence = updateSequence;

        MOCK_SESSION_CACHE.set(sessionKey, this, { ttl });
    }

    get files() {
        return this.#files;
    }

    get sessionKey() {
        return this.#sessionKey;
    }

    get expiry() {
        return this.#expiry;
    }

    /**
     * Adds the provided file to the session
     */
    addFile(file: MockSessionFile): MockSession {
        this.#files.push(file);

        if (this.#state === "pending") {
            this.#state = "running";
        }

        return this;
    }

    /**
     * Adds a random mapped file to the session and returns it
     */
    addMappedFile(): MockSessionFile {
        const entry: MockSessionFile = {
            listEntry: {
                name: `${randomUUID()}.json`,
                objectVersion: "1.0.0",
                schema: { standard: "digime", version: "1.0.0" },
                updatedDate: Math.round(Date.now() / 1000),
            },
            headerXMetadata: {
                metadata: {
                    objectCount: 26,
                    objectType: "followedartist",
                    objectVersion: "1.0.0",
                    schema: { standard: "digime", version: "1.0.0" },
                    serviceGroup: "entertainment",
                    serviceName: "spotify",
                },
                size: 25565,
            },
            contentPath: "test-mapped-file.json",
        };

        this.#files.push(entry);

        if (this.#state === "pending") {
            this.#state = "running";
        }

        return entry;
    }

    /**
     * Adds a random raw file to the session and returns it
     */
    addRawFile(): MockSessionFile {
        const entry: MockSessionFile = {
            headerXMetadata: {
                metadata: {
                    accounts: [{ accountid: "test" }],
                    created: Math.round(Date.now() / 1000),
                    contractid: "test-contract-id",
                    mimetype: "image/png",
                    objecttypes: [],
                    appid: "test-app-id",
                    partnerid: "test-partner-id",
                    hash: "4948fdb6cc724ae447324fe57b51d9e1",
                },
                size: 90688,
            },
            listEntry: {
                name: `test-image.png`,
                updatedDate: Math.round(Date.now() / 1000),
            },
            contentPath: "test-image.png",
        };

        this.#files.push(entry);

        if (this.#state === "pending") {
            this.#state = "running";
        }

        return entry;
    }

    /**
     * Updates the `updatedDate` of a random file
     */
    updateRandomFile(): boolean {
        if (this.#files.length <= 0) {
            return false;
        }

        const file = this.#files[randomInt(this.#files.length)];

        if (!file) {
            return false;
        }

        file.listEntry.updatedDate = Math.round(Date.now() / 1000);

        return true;
    }

    /**
     * Triggers the next `updateSequence` and removes it from the stack
     */
    advance(): MockSession {
        const nextUpdate = this.#updateSequence.shift();

        if (nextUpdate) {
            nextUpdate(this);
        }

        return this;
    }

    /**
     * Returns the `SessionFileList` of the current state of the `MockSession`
     */
    fileList(): SessionFileList {
        const fileList: SessionFileList = {
            status: {
                state: this.#state,
            },
        };

        // Pending has nothing else
        if (this.#state === "pending") return fileList;

        fileList.fileList = [];

        for (const file of this.#files) {
            fileList.fileList.push(file.listEntry);
        }

        return fileList;
    }
}
