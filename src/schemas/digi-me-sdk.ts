/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";
import { SessionTriggerConfiguration } from "./api/session/session-trigger-configuration";
import { UserAuthorization } from "../user-authorization";
import type { Session } from "./api/session/session";

/**
 * `<instance>.getAvailableServices()`
 */

/** Options argument */
export const GetAvailableServicesOptions = z
    .object({
        /** ID of the contract you wish to filter the results by */
        contractId: z.string().optional(),

        /** AbortSignal that can be used to abort this operation */
        signal: z.instanceof(AbortSignal).optional(),
    })
    .default({});

export type GetAvailableServicesOptions = z.infer<typeof GetAvailableServicesOptions>;
export type GetAvailableServicesOptionsInput = z.input<typeof GetAvailableServicesOptions>;

/**
 * `<instance>.getAuthorizeUrl()`
 */

/** Options argument */
export const GetAuthorizeUrlOptions = z.object(
    {
        /** URL to be called after authorization is done */
        callback: z.string(),

        /** Extra state data to be passed back after the authorization flow */
        state: z.string(),

        /** Onboard a specific service while authorizing */
        serviceId: z.number().optional(),

        /** Any optional parameters for the share */
        sessionOptions: z
            .object({
                pull: SessionTriggerConfiguration.optional(),
            })
            .optional(),

        /** Associate this onboard to an existing user with an UserAuthorization you have */
        userAuthorization: z.instanceof(UserAuthorization).optional(),

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

        /** AbortSignal to abort this operation */
        signal: z.instanceof(AbortSignal).optional(),
    },
    {
        required_error: "`getAuthorizeUrl` parameters are required",
    },
);

export type GetAuthorizeUrlOptions = z.infer<typeof GetAuthorizeUrlOptions>;
export type GetAuthorizeUrlOptionsInput = z.input<typeof GetAuthorizeUrlOptions>;

/** Return type */
export type GetAuthorizeUrlReturn = {
    url: string;
    codeVerifier: string;
    session: Session;
};

/**
 * `<instance>.exchangeCodeForUserAuthorization()`
 */

/** Options argument */
export const ExchangeCodeForUserAuthorizationOptions = z.object({
    /** codeVerifier received as a result of `getAuthorizeUrl` call */
    codeVerifier: z.string(),

    /** authorizationCode received by the callback you provided to `getAuthorizeUrl` */
    authorizationCode: z.string(),

    /** AbortSignal to abort this operation */
    signal: z.instanceof(AbortSignal).optional(),
});

export type ExchangeCodeForUserAuthorizationOptions = z.infer<typeof ExchangeCodeForUserAuthorizationOptions>;

/**
 * `<instance>.getSampleDataSetsForSourceParameters()`
 */

/** Options argument */
export const GetSampleDataSetsForSourceOptions = z.object({
    /** ID of the source to be queried for data sets */
    sourceId: z.number(),

    /** AbortSignal to abort this operation */
    signal: z.instanceof(AbortSignal).optional(),
});

export type GetSampleDataSetsForSourceOptions = z.infer<typeof GetSampleDataSetsForSourceOptions>;
