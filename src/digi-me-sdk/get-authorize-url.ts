/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";
import type { Session } from "../types/session";

/**
 * CAScope - timeRanges
 */
const TimeRange = z.object({
    from: z.number().optional(),
    to: z.number().optional(),
    last: z.string().optional(),
});

/**
 * CAScope - serviceGroups
 */
const ServiceObject = z.object({ id: z.number() });

const Service = z.object({
    id: z.number(),
    serviceObjectTypes: z.array(ServiceObject).optional(),
});

const ServiceGroup = z.object({
    id: z.number(),
    serviceTypes: z.array(Service).optional(),
});

/**
 * CAScope - criteria
 */
const Account = z.object({
    accountId: z.string(),
    username: z.string().optional(),
});

const Metadata = z.object({
    appid: z.array(z.string()).optional(),
    accounts: z.array(Account).optional(),
    contractId: z.array(z.string()).optional(),
    mimeType: z.array(z.string()).optional(),
    reference: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
});

const Criteria = z.object({
    from: z.number().optional(),
    last: z.string().optional(),
    metadata: Metadata.optional(),
});

/**
 * CA Scope
 *
 */
const CAScope = z.object({
    // Mapped
    timeRanges: z.array(TimeRange).optional(),
    serviceGroups: z.array(ServiceGroup).optional(),

    // Raw
    criteria: z.array(Criteria).optional(),
});

/**
 * PullSessionOptions
 */
const PullSessionOptions = z.object({
    /** ???? */
    limits: z
        .object({
            duration: z.object({
                sourceFetch: z.number(),
            }),
        })
        .optional(),

    /** ??? */
    scope: CAScope.optional(),
});

/**
 * `<instance>.getAuthorizeUrl()` input parameters
 */
export const GetAuthorizeUrlParameters = z.object({
    /** URL to be called after authorization is done */
    callback: z.string(),

    /** Extra state data to be passed back after the authorization flow */
    state: z.string(),

    /** Onboard a specific service while authorizing */
    serviceId: z.number().optional(),

    /** Any optional parameters for the share */
    sessionOptions: z
        .object({
            pull: PullSessionOptions.optional(),
        })
        .optional(),

    /** TokenPair you may already have for this user */
    // tokenPair: TokenPayload.optional(),

    /**
     * Only show services of specific sourceType
     * @defaultValue `"pull"`
     */
    sourceType: z.union([z.literal("pull"), z.literal("push")]).default("pull"),

    /**
     * Set the preferred locale to be used in the authorization interface
     *
     * - If `preferredLocale` is not set, the authorization interface will attempt to autodetect
     * - If the provided locale is not supported, the authorization interface will attempt to autodetect
     *
     * Autodetection in the authorization interface works by detecting the preferred browser languages,
     * and picking the best match that is supported. If that fails, it falls back to `en`.
     */
    preferredLocale: z.string().optional(),

    /**
     * Flag to indicate to the authorization interface if it should include
     * sources that are only onboardable with sample data.
     *
     * By default, the authorization interface **does not** include sample only sources.
     */
    includeSampleDataOnlySources: z.boolean().optional(),
});

export type GetAuthorizeUrlParameters = z.infer<typeof GetAuthorizeUrlParameters>;
export type GetAuthorizeUrlParametersInput = z.input<typeof GetAuthorizeUrlParameters>;

/**
 * `<instance>.getAuthorizeUrl()` return type
 */
export type GetAuthorizeUrlReturn = {
    url: string;
    codeVerifier: string;
    session: Session;
};
