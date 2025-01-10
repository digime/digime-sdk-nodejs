/*!
 * © World Data Exchange. All rights reserved.
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

export interface SampleDataOptions {
    /**
     * Dataset ID to use for sample data onboard returned in getServiceSampleDataSets
     */
    dataSet: string;

    /**
     * Skip all steps in authorization proces and do auto onboard flow for sample data. Dafault to false.
     */
    autoOnboard?: boolean;
}

export const SampleDataOptionsCodec: t.Type<SampleDataOptions> = t.intersection([
    t.type({
        dataSet: t.string,
    }),
    t.partial({
        autoOnboard: t.boolean,
    }),
]);

export type SourceType = "pull" | "push";

export const SourceTypeCodec: t.Type<SourceType> = t.keyof({
    pull: null,
    push: null,
});

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

export interface SourceFetchFilter {
    account: {
        id: string[];
    };
}

export interface PullSessionOptions {
    limits?: {
        duration?: {
            sourceFetch?: number;
        };
    };
    scope?: CAScope;
    /**
     * If set to false user will be able to see only existing data, without refreshing the library. Default value is true.
     */
    sourceFetch?: boolean;
    /**
     * Trigger account data sync only for accounts matching session scope and specified filter
     */
    sourceFetchFilter?: SourceFetchFilter;
}

export const SourceFetchFilterCodec: t.Type<SourceFetchFilter> = t.type({
    account: t.type({
        id: t.array(t.string),
    }),
});

export interface ServiceGroup {
    id: number;
    serviceTypes: Service[];
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
    serviceObjectTypes: ServiceObject[];
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

export const ServiceCodec: t.Type<Service> = t.type({
    id: t.number,
    serviceObjectTypes: t.array(
        t.type({
            id: t.number,
        })
    ),
});

export const ServiceGroupCodec: t.Type<ServiceGroup> = t.type({
    id: t.number,
    serviceTypes: t.array(ServiceCodec),
});

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
    sourceFetch: t.boolean,
    sourceFetchFilter: SourceFetchFilterCodec,
});

export const availableDataTypes = [
    "medication-information",
    "laboratory-results",
    "appointments",
    "patient-summary-hospital-data",
    "gp-data",
    "mental-health-patient-summary",
    "documents",
    "measurements-vital-signs",
    "allergy-intolerances",
    "images",
    "medication-related-intolerances",
    "referral-to-questionnaire",
    "questionnaire-response",
    "longterm-healthcare-patient-summary",
    "patient-corrections-request",
    "vaccinations",
    "integral-birth-care-process",
] as const;

export type DataType = (typeof availableDataTypes)[number];

export const DataTypeCodec: t.Type<DataType> = t.keyof({
    "medication-information": null,
    "laboratory-results": null,
    appointments: null,
    "patient-summary-hospital-data": null,
    "gp-data": null,
    "mental-health-patient-summary": null,
    documents: null,
    "measurements-vital-signs": null,
    "allergy-intolerances": null,
    images: null,
    "medication-related-intolerances": null,
    "referral-to-questionnaire": null,
    "questionnaire-response": null,
    "longterm-healthcare-patient-summary": null,
    "patient-corrections-request": null,
    vaccinations: null,
    "integral-birth-care-process": null,
});

export interface SourcesScope {
    /**
     * Data type to be filter sources by
     */
    dataType?: DataType[];
}

export const SourcesScopeCodec: t.Type<SourcesScope> = t.partial({
    dataType: t.array(DataTypeCodec),
});
