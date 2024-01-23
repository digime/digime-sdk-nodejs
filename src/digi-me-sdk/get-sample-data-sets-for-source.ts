/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";

/**
 * A single sample data set
 */
export const SampleDataSet = z
    .object({
        name: z.string(),
        description: z.string(),
    })
    .passthrough();

/**
 * A collection of sample data sets
 */
export const SampleDataSets = z.record(z.string(), SampleDataSet);
