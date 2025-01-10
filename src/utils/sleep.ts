/*!
 * © World Data Exchange. All rights reserved.
 */

export const sleep = (milliseconds: number): Promise<unknown> =>
    new Promise((resolve) => setTimeout(resolve, milliseconds));
