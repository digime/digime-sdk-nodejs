/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";

/**
 * `<instance>.getPortabilityReport()` input parameters
 */
export const GetPortabilityReportParameters = z.object({
    /**
     * Desired file format of the portability report. Currently only `xml` is supported.
     */
    format: z.literal("xml"),

    /**
     * Service type. `medmij` is only supported for now.
     * TODO: Better naming? Better description?
     */
    serviceType: z.literal("medmij"),

    /**
     * Desired start of the portability report.
     * Expects a timestamp in seconds.
     */
    from: z.number().optional(),

    /**
     * Desired end of the portability report.
     * Expects a timestamp in seconds.
     */
    to: z.number().optional(),

    /** AbortSignal to abort this operation */
    signal: z.instanceof(AbortSignal).optional(),
});

export type GetPortabilityReportParameters = z.infer<typeof GetPortabilityReportParameters>;
