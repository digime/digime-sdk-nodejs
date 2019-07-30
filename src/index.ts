/*!
 * Copyright (c) 2009-2019 digi.me Limited. All rights reserved.
 */

import { init } from "./sdk";

export * from "./sdk";
export * from "./errors";

export const {
    establishSession,
    getSessionAccounts,
    getSessionData,
    getGuestAuthorizeUrl,
    getAuthorizeUrl,
    getReceiptUrl,
    getCreatePostboxUrl,
    pushDataToPostbox,
    getPostboxImportUrl,
} = init();
