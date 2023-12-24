/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

export const abortableDelay = (milliseconds: number, signal?: AbortSignal): Promise<void> => {
    const delayPromises = [new Promise<void>((resolve) => setTimeout(resolve, milliseconds))];

    if (signal) {
        delayPromises.push(
            new Promise<void>((_, reject) => {
                signal.addEventListener(
                    "abort",
                    () => {
                        try {
                            signal.throwIfAborted();
                        } catch (e) {
                            reject(e);
                        }
                    },
                    { once: true, signal: AbortSignal.timeout(milliseconds + 1) },
                );
            }),
        );
    }

    return Promise.race(delayPromises);
};
