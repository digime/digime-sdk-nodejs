/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

/**
 * Extends [`Response`](https://developer.mozilla.org/docs/Web/API/Response) to
 * make `.json()` method return `Promise<unknown>` instead of `Promise<any>`
 */
interface DigiMeFetchResponse extends Response {
    json(): Promise<unknown>;
}

/**
 * Digi.me SDK's network wrapper
 */
export class Network {
    private refreshTokenHandler: () => void = () => {};

    constructor() {}

    /**
     * Wraps around [`fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/fetch) to provide some automation
     */
    public async fetch(...parameters: Parameters<typeof globalThis.fetch>): Promise<DigiMeFetchResponse> {
        const response: DigiMeFetchResponse = await globalThis.fetch(...parameters);

        // Handle non-ok (non-2xx) responses
        // if (!response.ok) {
        //     throw new Error("TODO: Error");
        // }

        return response;
    }

    /**
     * Refreshes expired access tokens
     */
    private async refreshTokens() {}
}
