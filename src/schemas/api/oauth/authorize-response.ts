/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";
import { Session } from "../session/session";

export const OauthAuthorizeResponse = z.object({
    token: z.string(),
    session: Session,
});
