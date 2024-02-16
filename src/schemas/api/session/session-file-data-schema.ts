/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";

export const SessionFileDataStandard = z.union([z.literal("digime"), z.literal("fhir")]);

export const SessionFileDataSchema = z
    .object({
        version: z.string(),
        id: z.string().optional(),
        standard: SessionFileDataStandard,
    })
    .passthrough();
