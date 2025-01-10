/*!
 * © World Data Exchange. All rights reserved.
 */

import { handleServerResponse, net } from "./net";
import { SDKConfiguration } from "./types/sdk-configuration";
import { TypeValidationError } from "./errors";
import * as t from "io-ts";
export type { DiscoveryService } from "./types/api/get-discovery-api-services";
import { ContractDetails, ContractDetailsCodec } from "./types/common";
import { sign } from "jsonwebtoken";
import { getRandomAlphaNumeric } from "./crypto";
import { CodecAssertion, codecAssertion } from "./utils/codec-assertion";
import { LiteralUnion } from "type-fest";

export interface SourceResource {
    url?: string;
    mimetype?: string;
}

export interface SourceService extends Record<string, unknown> {
    id: number;
    name?: string;
    reference?: string;
}

const SourceServiceCodec: t.Type<SourceService> = t.intersection([
    t.type({
        id: t.number,
    }),
    t.partial({
        name: t.string,
        reference: t.string,
    }),
]);

export type AuthorisationType = "saas" | "sdk" | "none";

export interface SourceAuthorisation {
    type?: AuthorisationType;
}

const SourceResourceCodec: t.Type<SourceResource> = t.partial({
    url: t.string,
    mimetype: t.string,
});

const SourceAuthorisationCodec: t.Type<SourceAuthorisation> = t.partial({
    type: t.union([t.literal("saas"), t.literal("sdk"), t.literal("none")]),
});

const SourcesJSONCodec: t.Type<SourcesJSON> = t.partial({
    authorisation: SourceAuthorisationCodec,
});

export type PublishedStatus = "approved" | "pending" | "deprecated" | "blocked" | "sampledataonly";

export interface SourcesJSON extends Record<string, unknown> {
    authorisation?: SourceAuthorisation;
}

export interface Source extends Record<string, unknown> {
    id: number;
    name?: string;
    resource?: SourceResource;
    service?: SourceService;
    publishedStatus?: PublishedStatus;
    json?: SourcesJSON;
}

const SourceCodec: t.Type<Source> = t.intersection([
    t.type({
        id: t.number,
    }),
    t.partial({
        name: t.string,
        resource: SourceResourceCodec,
        service: SourceServiceCodec,
        publishedStatus: t.union([
            t.literal("approved"),
            t.literal("pending"),
            t.literal("deprecated"),
            t.literal("blocked"),
            t.literal("sampledataonly"),
        ]),
        json: SourcesJSONCodec,
    }),
]);

export interface QuerySourcesResponse {
    /**
     * List of sources
     */
    data: Source[];
    /**
     * Page limit.
     */
    limit: number;
    /**
     * Page offset.
     */
    offset: number;
    /**
     * Total numner of source records.
     */
    total: number;
}

export interface SourcesSort {
    name: "asc" | "desc";
}

const SourcesSortCodec: t.Type<SourcesSort> = t.type({
    name: t.union([t.literal("asc"), t.literal("desc")]),
});

export interface SourcesSearch extends Record<string, unknown> {
    name?: string[];
    abbreviation?: string[];
    alias?: string[];
    medicalCenter?: string[];
    practitioner?: string[];
}

const SourcesSearchCodec: t.Type<SourcesSearch> = t.partial({
    name: t.array(t.string),
    abbreviation: t.array(t.string),
    alias: t.array(t.string),
    medicalCenter: t.array(t.string),
    practitioner: t.array(t.string),
});

export interface SourcesFilter extends Record<string, unknown> {
    id?: number[];
    publishedStatus?: PublishedStatus[];
    service?: {
        id: number[];
    };
    /**
     * Available countries with IDs can be fetched with queryCountries option.
     */
    country?: {
        id: number[];
    };
    /**
     * Available categories with IDs can be fetched with queryCategories option.
     */
    category?: {
        id: number[];
    };
    /**
     * Available platforms with IDs can be fetched with queryPlatforms option.
     */
    platform?: {
        id: number[];
    };
    /**
     * Possible types are pull (1) and push (2). Default is pull - [1].
     */
    type?: {
        id: number[];
    };
    sourceId?: number;
    reference?: string[];
    alias?: string[];
}

const SourcesFilterCodec: t.Type<SourcesFilter> = t.partial({
    id: t.array(t.number),
    publishedStatus: t.array(
        t.union([
            t.literal("approved"),
            t.literal("pending"),
            t.literal("deprecated"),
            t.literal("blocked"),
            t.literal("sampledataonly"),
        ])
    ),
    service: t.type({
        id: t.array(t.number),
    }),
    country: t.type({
        id: t.array(t.number),
    }),
    category: t.type({
        id: t.array(t.number),
    }),
    platform: t.type({
        id: t.array(t.number),
    }),
    type: t.type({
        id: t.array(t.number),
    }),
    sourceId: t.number,
    reference: t.array(t.string),
    alias: t.array(t.string),
});

export type IncludeFieldList =
    | "category"
    | "category.id"
    | "category.json"
    | "category.name"
    | "category.reference"
    | "country"
    | "country.id"
    | "country.json"
    | "country.code"
    | "country.name"
    | "dynamic"
    | "id"
    | "onboardable"
    | "name"
    | "platform"
    | "platform.id"
    | "platform.json"
    | "platform.name"
    | "platform.reference"
    | "publishedDate"
    | "publishedStatus"
    | "reference"
    | "resource.url"
    | "resource.mimetype"
    | "service"
    | "service.id"
    | "service.json"
    | "service.name"
    | "service.publishedDate"
    | "service.publishedStatus"
    | "service.reference"
    | "type"
    | "type.id"
    | "type.name"
    | "type.reference"
    | "json";

export interface SourcesBodyParams extends Record<string, unknown> {
    limit?: number;
    offset?: number;
    sort?: SourcesSort;
    query?: {
        search?: SourcesSearch;
        /**
         * Query string as in user text search
         */
        queryString?: string;
        include?: LiteralUnion<IncludeFieldList, string>[];
        filter?: SourcesFilter;
    };
}

const SourcesBodyParamsCodec: t.Type<SourcesBodyParams> = t.partial({
    limit: t.number,
    offset: t.number,
    sort: SourcesSortCodec,
    query: t.partial({
        search: SourcesSearchCodec,
        queryString: t.string,
        include: t.array(t.string),
        filter: SourcesFilterCodec,
    }),
});

export interface QuerySourcesOptions {
    /**
     * Contract details here.
     */
    contractDetails: ContractDetails;
    /**
     * Params for searching, paging, filtering, sorting and other options.
     */
    sourcesBodyParams?: SourcesBodyParams;
}

const QuerySourcesOptionsCodec: t.Type<QuerySourcesOptions> = t.intersection([
    t.type({
        contractDetails: ContractDetailsCodec,
    }),
    t.partial({
        sourcesBodyParams: SourcesBodyParamsCodec,
    }),
]);

const QuerySourcesResponseCodec: t.Type<QuerySourcesResponse> = t.type({
    data: t.array(SourceCodec),
    limit: t.number,
    offset: t.number,
    total: t.number,
});

const assertIsSourcesApiData: CodecAssertion<QuerySourcesResponse> = codecAssertion(QuerySourcesResponseCodec);

const querySources = async (
    options: QuerySourcesOptions,
    sdkConfig: SDKConfiguration
): Promise<QuerySourcesResponse> => {
    if (!QuerySourcesOptionsCodec.is(options)) {
        throw new TypeValidationError(
            "Parameters failed validation. Parameters should be as described in QuerySourcesOptions type"
        );
    }

    try {
        const { contractDetails, sourcesBodyParams } = options;
        const { contractId, privateKey } = contractDetails;

        // Apply defaults
        const bodyParams: SourcesBodyParams = structuredClone(sourcesBodyParams) ?? {};
        bodyParams.query ??= {};
        bodyParams.query.filter ??= {};

        if (!Object.hasOwn(bodyParams.query.filter, "type")) {
            bodyParams.query.filter.type = { id: [1] }; // default pull type
        }

        if (!Object.hasOwn(bodyParams.query.filter, "publishedStatus")) {
            bodyParams.query.filter.publishedStatus = ["approved"];
        }

        const response = await net.post(`${String(sdkConfig.baseUrl)}discovery/sources`, {
            headers: {
                "Content-Type": "application/json",
            },
            json: bodyParams,
            responseType: "json",
            retry: { ...sdkConfig.retryOptions, methods: ["POST"] },
            hooks: {
                beforeRequest: [
                    (options) => {
                        const jwt: string = sign(
                            {
                                client_id: `${sdkConfig.applicationId}_${contractId}`,
                                nonce: getRandomAlphaNumeric(32),
                                timestamp: Date.now(),
                            },
                            privateKey.toString(),
                            {
                                algorithm: "PS512",
                                noTimestamp: true,
                            }
                        );
                        options.headers["Authorization"] = `Bearer ${jwt}`;
                    },
                ],
            },
        });

        assertIsSourcesApiData(response.body);

        return {
            ...response.body,
        };
    } catch (error) {
        handleServerResponse(error);
        throw error;
    }
};

export { querySources };
