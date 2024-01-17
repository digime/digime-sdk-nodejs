/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

export const abortableDelay = (milliseconds: number, signal?: AbortSignal): Promise<void> => {
    return new Promise((resolve, reject) => {
        signal?.throwIfAborted();
        signal?.addEventListener("abort", handler, { once: true });

        const timeoutId = setTimeout(() => {
            signal?.removeEventListener("abort", handler);
            resolve();
        }, milliseconds);

        function handler() {
            clearTimeout(timeoutId);
            reject(signal?.reason);
        }
    });
};
