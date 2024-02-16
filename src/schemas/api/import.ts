/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";

export const FileDescriptor = z.object({
    mimeType: z.string(),
    accounts: z.array(z.object({ accountId: z.string() })),
    reference: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
});
