/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";
import { SessionTriggerConfiguration } from "./api/session/session-trigger";
import { FileDescriptor } from "./api/import";

/**
 * `<instance>.readAccounts()`
 */

/** Options argument */
export const ReadAccountsOptions = z
    .object({
        /** AbortSignal to abort this operation */
        signal: z.instanceof(AbortSignal).optional(),
    })
    .default({});

export type ReadAccountsOptions = z.infer<typeof ReadAccountsOptions>;
export type ReadAccountsOptionsInput = z.input<typeof ReadAccountsOptions>;

/**
 * `<instance>.deleteUser()`
 */

/** Options argument */
export const DeleteUserOptions = z
    .object({
        /** AbortSignal to abort this operation */
        signal: z.instanceof(AbortSignal).optional(),
    })
    .default({});

export type DeleteUserOptions = z.infer<typeof DeleteUserOptions>;
export type DeleteUserOptionsInput = z.input<typeof DeleteUserOptions>;

/**
 * `<instance>.getPortabilityReport()`
 */

/** As argument */
export const GetPortabilityReportAs = z.union(
    [z.literal("string"), z.literal("ReadableStream"), z.literal("NodeReadable")],
    {
        errorMap: () => ({
            message: 'Must be one of: "string", "ReadableStream",  "NodeReadable"',
        }),
    },
);

export type GetPortabilityReportAs = z.infer<typeof GetPortabilityReportAs>;

/** Options argument */
export const GetPortabilityReportOptions = z.object({
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

export type GetPortabilityReportOptions = z.infer<typeof GetPortabilityReportOptions>;

/**
 * `<instance>.readSession()`
 */

/** Baseline options */
const ReadSessionOptionsBase = z.object({
    /** AbortSignal to abort this operation */
    signal: z.instanceof(AbortSignal).optional(),
});

/** Options argument */
export const ReadSessionOptions = SessionTriggerConfiguration.merge(ReadSessionOptionsBase).default({});

export type ReadSessionOptionsInput = z.input<typeof ReadSessionOptions>;
export type ReadSessionOptions = z.infer<typeof ReadSessionOptions>;

/**
 * `<instance>.readFileList()`
 */
export const ReadFileListOptions = z.object({
    /** SessionKey of the session you wish to read the file list for */
    sessionKey: z.string(),

    /** AbortSignal to abort this operation */
    signal: z.instanceof(AbortSignal).optional(),
});

export type ReadFileListOptions = z.infer<typeof ReadFileListOptions>;

/**
 * `<instance>.readFile()` input parameters
 */

/** Options argument */
export const ReadFileOptions = z.object({
    sessionKey: z.string(),
    fileName: z.string(),
    signal: z.instanceof(AbortSignal).optional(),
});

export type ReadFileOptions = z.infer<typeof ReadFileOptions>;

/**
 * `<instance>.pushData()` input parameters
 */

/** Push to library options shape */
const PushDataOptionsToLibrary = z.object({
    type: z.literal("library"),
    fileDescriptor: FileDescriptor,
    data: z.instanceof(ReadableStream),
    signal: z.instanceof(AbortSignal).optional(),
});

/** Push to provider options shape */
const PushDataOptionsToProvider = z.object({
    type: z.literal("provider"),
    data: z.record(z.string(), z.unknown()),
    version: z.union([z.literal("stu3"), z.literal("3.0.2")]),
    standard: z.literal("fhir"),
    accountId: z.string(),
    signal: z.instanceof(AbortSignal).optional(),
});

/** Options argument */
export const PushDataOptions = z.union([PushDataOptionsToLibrary, PushDataOptionsToProvider]);

export type PushDataOptions = z.infer<typeof PushDataOptions>;
