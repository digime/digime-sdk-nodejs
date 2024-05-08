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

export interface CountryResource {
    mimetype?: string;
    resize?: string;
    type?: number;
    url?: string;
}

const ResourceCodec: t.Type<CountryResource> = t.partial({
    mimetype: t.string,
    resize: t.string,
    type: t.number,
    url: t.string,
});

export interface Country {
    id: number;
    code?: string;
    name?: string;
    resource?: CountryResource;
}

export const CountryCodec: t.Type<Country> = t.intersection([
    t.type({
        id: t.number,
    }),
    t.partial({
        code: t.string,
        name: t.string,
        resource: ResourceCodec,
    }),
]);

export interface QueryCountriesResponse {
    /**
     * List of countries
     */
    data: Country[];
}

export type CountriesIncludeFieldList =
    | "id"
    | "name"
    | "code"
    | "resource.url"
    | "resource.mimetype"
    | "resource.resize"
    | "resource.type";

const CountriesIncludeFieldListCodec: t.Type<CountriesIncludeFieldList> = t.union([
    t.literal("id"),
    t.literal("name"),
    t.literal("code"),
    t.literal("resource.url"),
    t.literal("resource.mimetype"),
    t.literal("resource.resize"),
    t.literal("resource.type"),
]);

export interface CountriesBodyParams {
    query?: {
        /**
         * Posible fields to include are defined in type CountriesIncludeFieldList .
         */
        include?: CountriesIncludeFieldList[];
        filter?: {
            id?: number[];
        };
    };
}

export const CountriesBodyParamsCodec: t.Type<CountriesBodyParams> = t.partial({
    query: t.partial({
        include: t.array(CountriesIncludeFieldListCodec),
    }),
});

export interface QueryCountriesOptions {
    /**
     * Contract details here.
     */
    contractDetails: ContractDetails;
    /**
     * Additional query options.
     */
    countriesBodyParams?: CountriesBodyParams;
}

export const QueryCountriesOptionsCodec: t.Type<QueryCountriesOptions> = t.intersection([
    t.type({
        contractDetails: ContractDetailsCodec,
    }),
    t.partial({
        countriesBodyParams: CountriesBodyParamsCodec,
    }),
]);

export const QueryCountriesResponseCodec: t.Type<QueryCountriesResponse> = t.type({
    data: t.array(CountryCodec),
});

export const assertIsCountriesApiData: CodecAssertion<QueryCountriesResponse> =
    codecAssertion(QueryCountriesResponseCodec);

const queryCountries = async (
    options: QueryCountriesOptions,
    sdkConfig: SDKConfiguration
): Promise<QueryCountriesResponse> => {
    if (!QueryCountriesOptionsCodec.is(options)) {
        throw new TypeValidationError(
            "Parameters failed validation. Params should be defined as outlined in QueryCountriesOptions type"
        );
    }

    const { contractDetails, countriesBodyParams } = options;
    const { contractId, privateKey } = contractDetails;

    // set body params
    const bodyParams: CountriesBodyParams = {
        query: {
            include: countriesBodyParams?.query?.include || ["id", "name"],
            filter: {
                ...(countriesBodyParams?.query?.filter?.id && { id: countriesBodyParams?.query?.filter?.id }),
            },
        },
    };

    const response = await net.post(`${sdkConfig.baseUrl}discovery/countries`, {
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

    assertIsCountriesApiData(response.body);

    return {
        ...response.body,
    };
};

export { queryCountries };
