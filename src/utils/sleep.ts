/*!
 * Copyright (c) 2009-2022 digi.me Limited. All rights reserved.
 */

export const sleep = (milliseconds: number): Promise<unknown> =>
    new Promise((resolve) => setTimeout(resolve, milliseconds));
