/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
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

export interface CategoryResource {
    mimetype?: string;
    resize?: string;
    type?: number;
    url?: string;
}

const ResourceCodec: t.Type<CategoryResource> = t.partial({
    mimetype: t.string,
    resize: t.string,
    type: t.number,
    url: t.string,
});

export interface Category {
    id: number;
    categoryTypeId?: number;
    name?: string;
    reference?: string;
    resource?: CategoryResource;
    subTitle?: string;
    title?: string;
    expandedTitle?: string;
    expandedSubTitle?: string;
}

const PlatformCodec: t.Type<Category> = t.intersection([
    t.type({
        id: t.number,
    }),
    t.partial({
        categoryTypeId: t.number,
        name: t.string,
        reference: t.string,
        resource: ResourceCodec,
        subTitle: t.string,
        title: t.string,
        expandedTitle: t.string,
        expandedSubTitle: t.string,
    }),
]);

export interface QueryCategoriesResponse {
    /**
     * List of categories
     */
    data: Category[];
}

export type CategoriesIncludeFieldList = "id" | "name" | "reference" | "json" | "resource.mimetype" | "resource.url";

const CategoriesIncludeFieldListCodec: t.Type<CategoriesIncludeFieldList> = t.union([
    t.literal("id"),
    t.literal("name"),
    t.literal("reference"),
    t.literal("json"),
    t.literal("resource.mimetype"),
    t.literal("resource.url"),
]);

export interface CategoriesBodyParams {
    query?: {
        /**
         * Posible fields to include are defined in type CategoriesIncludeFieldList .
         */
        include?: CategoriesIncludeFieldList[];
        filter?: {
            id?: number[];
        };
    };
}

const CategoriesBodyParamsCodec: t.Type<CategoriesBodyParams> = t.partial({
    query: t.partial({
        include: t.array(CategoriesIncludeFieldListCodec),
    }),
});

export interface QueryCategoriesOptions {
    /**
     * Contract details here.
     */
    contractDetails: ContractDetails;
    /**
     * Params for searching, paging, filtering, sorting and other options.
     */
    categoriesBodyParams?: CategoriesBodyParams;
}

const QueryCategoriesOptionsCodec: t.Type<QueryCategoriesOptions> = t.intersection([
    t.type({
        contractDetails: ContractDetailsCodec,
    }),
    t.partial({
        categoriesBodyParams: CategoriesBodyParamsCodec,
    }),
]);

const QueryCategoriesResponseCodec: t.Type<QueryCategoriesResponse> = t.type({
    data: t.array(PlatformCodec),
});

const assertIsCategoriesApiData: CodecAssertion<QueryCategoriesResponse> = codecAssertion(QueryCategoriesResponseCodec);

const queryCategories = async (
    options: QueryCategoriesOptions,
    sdkConfig: SDKConfiguration
): Promise<QueryCategoriesResponse> => {
    if (!QueryCategoriesOptionsCodec.is(options)) {
        throw new TypeValidationError(
            "Parameters failed validation. Params should be defined as outlined in QueryCategoriesOptions type"
        );
    }

    const { contractDetails, categoriesBodyParams } = options;
    const { contractId, privateKey } = contractDetails;

    // set body params
    const bodyParams: CategoriesBodyParams = {
        query: {
            include: categoriesBodyParams?.query?.include || ["id", "name", "reference"],
            filter: {
                ...(categoriesBodyParams?.query?.filter?.id && { id: categoriesBodyParams?.query?.filter?.id }),
            },
        },
    };

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

    const response = await net.post(`${sdkConfig.baseUrl}discovery/categories`, {
        headers: {
            Authorization: `Bearer ${jwt}`,
            "Content-Type": "application/json",
        },
        json: bodyParams,
        responseType: "json",
    });

    assertIsCategoriesApiData(response.body);

    return {
        ...response.body,
    };
};

export { queryCategories };
