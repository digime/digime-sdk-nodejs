/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import * as t from "io-ts";
import { isNonEmptyString } from "../utils/basic-utils";

export interface ContractDetails {
    /**
     * The ID of the contract to use
     */
    contractId: string;

    /**
     * A string of the private key in PKCS1 format
     */
    privateKey: string;
}

export interface CAScope {
    /**
     * Control the scope of mapped data using time ranges
     */
    timeRanges?: TimeRange[];

    /**
     * Control the scope for mapped data using service groups
     */
    serviceGroups?: ServiceGroup[];

    /**
     * Control the scope for raw data
     */
    criteria?: Criteria[];
}

export interface PullSessionOptions {
    limits?: {
        duration?: {
            sourceFetch?: number;
        };
    };
    scope?: CAScope;
}

export interface ServiceGroup {
    id: number;
    serviceTypes?: Service[];
}

export interface Criteria {
    from?: number;
    last?: string;
    metadata?: Metadata;
}

export interface Account {
    accountId: string;
    username?: string;
}

export interface Metadata {
    appId?: string[];
    accounts?: Account[];
    contractId?: string[];
    mimeType?: string[];
    reference?: string[];
    tags?: string[];
}

export interface Service {
    id: number;
    serviceObjectTypes?: ServiceObject[];
}

export interface ServiceObject {
    id: number;
}

export interface TimeRange {
    from?: number;
    last?: string;
    to?: number;
}

export const ContractDetailsRawCodec: t.Type<ContractDetails> = t.type({
    contractId: t.string,
    privateKey: t.string,
});

export const ContractDetailsCodec = new t.Type<ContractDetails, ContractDetails, unknown>(
    "ContractDetails",
    (input: unknown): input is ContractDetails => isValidContractDetails(input),
    // `t.success` and `t.failure` are helpers used to build `Either` instances
    (input, context) => (isValidContractDetails(input) ? t.success(input) : t.failure(input, context)),
    // `A` and `O` are the same, so `encode` is just the identity function
    t.identity
);

const isValidContractDetails = (input: unknown): input is ContractDetails => {
    if (ContractDetailsRawCodec.is(input)) {
        return isNonEmptyString(input.contractId) && isNonEmptyString(input.privateKey);
    }

    return false;
};

export const TimeRangeCodec: t.Type<TimeRange> = t.partial({
    from: t.number,
    last: t.string,
    to: t.number,
});

export const ServiceCodec: t.Type<Service> = t.intersection([
    t.type({
        id: t.number,
    }),
    t.partial({
        serviceObjectTypes: t.array(
            t.type({
                id: t.number,
            })
        ),
    }),
]);

export const ServiceGroupCodec: t.Type<ServiceGroup> = t.intersection([
    t.type({
        id: t.number,
    }),
    t.partial({
        serviceTypes: t.array(ServiceCodec),
    }),
]);

export const CAScopeCodec: t.Type<CAScope> = t.partial({
    timeRanges: t.array(TimeRangeCodec),
    serviceGroups: t.array(ServiceGroupCodec),
});

export const PullSessionOptionsCodec: t.Type<PullSessionOptions> = t.partial({
    limits: t.partial({
        duration: t.partial({
            sourceFetch: t.number,
        }),
    }),
    scope: CAScopeCodec,
});
