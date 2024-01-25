/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { setupServer } from "msw/node";
import { handlers as jwksOauthHandlers } from "./api/jwks/oauth/handlers";

export const mswServer = setupServer(...jwksOauthHandlers);
