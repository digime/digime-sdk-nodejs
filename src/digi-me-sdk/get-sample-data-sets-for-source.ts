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

export type SampleDataSet = z.infer<typeof SampleDataSet>;

/**
 * A collection of sample data sets
 */
export const SampleDataSets = z.record(z.string(), SampleDataSet);

export type SampleDataSets = z.infer<typeof SampleDataSets>;

/**
 * `<instance>.getSampleDataSetsForSourceParameters()` input parameters
 */
export const GetSampleDataSetsForSourceParameters = z.object({
    /** ID of the source to be queried for data sets */
    sourceId: z.number(),

    /** AbortSignal to abort this operation */
    signal: z.instanceof(AbortSignal).optional(),
});

export type GetSampleDataSetsForSourceParameters = z.infer<typeof GetSampleDataSetsForSourceParameters>;
