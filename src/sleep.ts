/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

export const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
