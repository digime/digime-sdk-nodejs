/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";
import { SampleDataSet } from "./sample-data-set";

/**
 * A collection of sample data sets
 */
export const SampleDataSets = z.record(z.string(), SampleDataSet);

export type SampleDataSets = z.infer<typeof SampleDataSets>;
