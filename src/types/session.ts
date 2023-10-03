/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";

export const Session = z.object({
    expiry: z.number(),
    key: z.string(),
});

export type Session = z.infer<typeof Session>;
