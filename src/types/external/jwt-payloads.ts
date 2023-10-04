/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import z from "zod";

export const PayloadPreauthorizationCode = z.object({
    preauthorization_code: z.string(),
});

export type PayloadPreauthorizationCode = z.infer<typeof PayloadPreauthorizationCode>;
