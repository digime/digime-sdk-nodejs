/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { net } from "./net";
import { SDKConfiguration } from "./types/sdk-configuration";
import { TypeValidationError } from "./errors";
import * as t from "io-ts";
export type { DiscoveryService } from "./types/api/get-discovery-api-services";
import { ContractDetails, ContractDetailsCodec } from "./types/common";
import { sign } from "jsonwebtoken";
import { getRandomAlphaNumeric } from "./crypto";
import { CodecAssertion, codecAssertion } from "./utils/codec-assertion";

export interface SourceResource {
    url: string;
    mimetype: string;
}

export interface SourceService {
    id: number;
    name: string;
    reference: string;
}

const SourceServiceCodec: t.Type<SourceService> = t.type({
    id: t.number,
    name: t.string,
    reference: t.string,
});

export type AuthorisationType = "saas" | "sdk" | "none";

export interface SourceAuthorisation {
    type: AuthorisationType;
}

const SourceResourceCodec: t.Type<SourceResource> = t.type({
    url: t.string,
    mimetype: t.string,
});

const SourceAuthorisationCodec: t.Type<SourceAuthorisation> = t.type({
    type: t.union([t.literal("saas"), t.literal("sdk"), t.literal("none")]),
});

const SourcesJSONCodec: t.Type<SourcesJSON> = t.type({
    authorisation: SourceAuthorisationCodec,
});

export type PublishedStatus = "approved" | "pending" | "deprecated" | "blocked" | "sampledataonly";

export interface SourcesJSON {
    authorisation: SourceAuthorisation;
}

export interface Source {
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

export interface SourcesSearch {
    name: string;
}

const SourcesSearchCodec: t.Type<SourcesSearch> = t.type({
    name: t.string,
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

const IncludeCodec: t.Type<IncludeFieldList> = t.union([
    t.literal("category"),
    t.literal("category.id"),
    t.literal("category"),
    t.literal("category.id"),
    t.literal("category.json"),
    t.literal("category.name"),
    t.literal("category.reference"),
    t.literal("country"),
    t.literal("country.id"),
    t.literal("country.json"),
    t.literal("country.code"),
    t.literal("country.name"),
    t.literal("dynamic"),
    t.literal("id"),
    t.literal("onboardable"),
    t.literal("name"),
    t.literal("platform"),
    t.literal("platform.id"),
    t.literal("platform.json"),
    t.literal("platform.name"),
    t.literal("platform.reference"),
    t.literal("publishedDate"),
    t.literal("publishedStatus"),
    t.literal("reference"),
    t.literal("resource.url"),
    t.literal("resource.mimetype"),
    t.literal("service"),
    t.literal("service.id"),
    t.literal("service.json"),
    t.literal("service.name"),
    t.literal("service.publishedDate"),
    t.literal("service.publishedStatus"),
    t.literal("service.reference"),
    t.literal("type"),
    t.literal("type.id"),
    t.literal("type.name"),
    t.literal("type.reference"),
    t.literal("json"),
]);

export interface SourcesBodyParams {
    limit?: number;
    offset?: number;
    sort?: SourcesSort;
    query?: {
        search?: SourcesSearch;
        include?: IncludeFieldList[];
        filter?: {
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
        };
    };
}

const SourcesBodyParamsCodec: t.Type<SourcesBodyParams> = t.partial({
    limit: t.number,
    offset: t.number,
    sort: SourcesSortCodec,
    query: t.partial({
        search: SourcesSearchCodec,
        include: t.array(IncludeCodec),
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

    const { contractDetails, sourcesBodyParams } = options;
    const { contractId, privateKey } = contractDetails;

    // set body params
    const bodyParams: SourcesBodyParams = {
        limit: sourcesBodyParams?.limit || 10,
        offset: sourcesBodyParams?.offset || 0,
        sort: sourcesBodyParams?.sort || {
            name: "asc",
        },
        query: {
            include: sourcesBodyParams?.query?.include || [
                "id",
                "name",
                "resource.mimetype",
                "resource.url",
                "service.id",
                "service.name",
                "service.reference",
                "country.id",
                "country.name",
                "platform.id",
                "platform.name",
                "platform.reference",
                "publishedStatus",
                "json",
            ],
            filter: {
                // default type is pull
                type: sourcesBodyParams?.query?.filter?.type || { id: [1] },
                publishedStatus: sourcesBodyParams?.query?.filter?.publishedStatus || ["approved"],
                ...(sourcesBodyParams?.query?.filter?.service && {
                    service: sourcesBodyParams?.query?.filter?.service,
                }),
                ...(sourcesBodyParams?.query?.filter?.id && { id: sourcesBodyParams?.query?.filter?.id }),
                ...(sourcesBodyParams?.query?.filter?.country && {
                    country: sourcesBodyParams?.query?.filter?.country,
                }),
            },
            ...(sourcesBodyParams?.query?.search && { search: sourcesBodyParams?.query?.search }),
        },
    };

    const response = await net.post(`${sdkConfig.baseUrl}discovery/sources`, {
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
};

export { querySources };
