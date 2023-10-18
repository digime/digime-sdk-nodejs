/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";
import type { Session } from "../session";
import { TokenPair } from "../external/tokens";

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
 * getAuthorizeUrl input parameters
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
    tokenPair: TokenPair.optional(),

    /**
     * Only show services of specific sourceType
     * @defaultValue `"pull"`
     */
    sourceType: z.union([z.literal("pull"), z.literal("push")]).optional(),
});

export type GetAuthorizeUrlParameters = z.infer<typeof GetAuthorizeUrlParameters>;

/**
 * getAuthorizeUrl return type
 */
export type GetAuthorizeUrlReturn = {
    url: string;
    codeVerifier: string;
    session: Session;
};
