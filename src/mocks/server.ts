/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { setupServer } from "msw/node";

export const mswServer = setupServer();

mswServer.listen({
    onUnhandledRequest: "warn",
});
