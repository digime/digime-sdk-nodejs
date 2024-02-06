/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";

/** Raw data scoping criteria metadata account */
const ScopeCriteriaMetadataAccount = z.object({
    accountId: z.string().optional(),
    username: z.string().optional(),
});

/** Raw data scoping criteria metadata */
const ScopeCriteriaMetadata = z.object({
    accounts: z.array(ScopeCriteriaMetadataAccount).optional(),
    appId: z.array(z.string()).optional(),
    contractId: z.array(z.string()).optional(),
    mimeType: z.array(z.string()).optional(),
    reference: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
});

/** Raw data scoping criteria */
const ScopeCriteria = z.object({
    from: z.number().optional(),
    last: z.string().optional(),
    metadata: ScopeCriteriaMetadata.optional(),
});

/** Mapped data scoping - Object type level */
const ScopeServiceGroupServiceServiceObject = z.object({
    /**
     * ID of the object you wish to scope by.
     *
     * Reference: https://developers.digi.me/docs/references/objects
     */
    id: z.number(),
});

/** Mapped data scoping - Service level */
const ScopeServiceGroupService = z.object({
    /**
     * ID of the service you wish to scope by.
     *
     * NOTE: This is the `.serviceId` property on the Discovery source object,
     * not the `.id`
     */
    id: z.number(),

    /** Additional scoping by objects */
    serviceObjectTypes: z.array(ScopeServiceGroupServiceServiceObject).optional(),
});

/** Mapped data scoping - Service Group level */
const ScopeServiceGroup = z.object({
    /**
     * ID of the service group you wish to scope by.
     *
     * NOTE: This is the `.id` property on the Discovery source group object.
     */
    id: z.number(),

    /**
     * Additional scoping by services
     * NOTE: Services are **NOT** sources
     */
    serviceTypes: z.array(ScopeServiceGroupService).optional(),
});

/** Mapped data scoping - Time range level */
const ScopeTimeRange = z.object({
    from: z.number().optional(),
    to: z.number().optional(),
    last: z.number().optional(),
});

/**
 * Data Scoping
 */
const Scope = z.object({
    /** Raw data scoping criteria */
    criteria: z.array(ScopeCriteria).optional(),

    /** Mapped data scoping: service group > service > object type */
    serviceGroups: z.array(ScopeServiceGroup).optional(),

    /** Mapped data time scoping */
    timeRanges: z.array(ScopeTimeRange).optional(),
});

export const ReadSessionOptions = z.object({
    /** TODO: Document, what is this? */
    limits: z
        .object({
            duration: z
                .object({
                    sourceFetch: z.number().optional(),
                })
                .optional(),
        })
        .optional(),

    /**
     * Data scoping options
     */
    scope: Scope.optional(),

    /** Should digi.me update the data from sources of the data.
     * - `true` - Update data, then make it available.
     * - `false` - Only data currently present in the library will be available. No new data will be retrieved.
     *
     * @defaultValue `true`
     */
    sourceFetch: z.boolean().default(true),

    /** AbortSignal to abort this operation */
    signal: z.instanceof(AbortSignal).optional(),
});

export type ReadSessionOptionsInput = z.input<typeof ReadSessionOptions>;
export type ReadSessionOptions = z.infer<typeof ReadSessionOptions>;
