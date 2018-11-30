/*!
 * Copyright (c) 2009-2018 digi.me Limited. All rights reserved.
 */

import { createSDK } from "./sdk";

export * from "./sdk";
export * from "./errors";

export const {
    establishSession,
    getDataForSession,
    getWebURL,
    getAppURL,
} = createSDK();
