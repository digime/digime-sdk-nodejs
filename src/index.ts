/*!
 * Copyright (c) 2009-2020 digi.me Limited. All rights reserved.
 */

import { init } from "./sdk";

export * from "./sdk";
export * from "./errors";

export const {
    establishSession,
    exchangeCodeForToken,
    authorizeOngoingAccess,
    getSessionAccounts,
    getSessionData,
    getGuestAuthorizeUrl,
    getAuthorizeUrl,
    getPostboxImportUrl,
    getReceiptUrl,
    getCreatePostboxUrl,
    pushDataToPostbox,
    getFile,
    getFileList,
} = init();
