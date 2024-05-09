/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

export const sleep = (milliseconds: number): Promise<unknown> =>
    new Promise((resolve) => setTimeout(resolve, milliseconds));
