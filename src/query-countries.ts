/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
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

export interface Country extends Record<string, unknown> {
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

export interface CountriesBodyParams extends Record<string, unknown> {
    query?: {
        /**
         * Posible fields to include are defined in type CountriesIncludeFieldList .
         */
        include?: LiteralUnion<CountriesIncludeFieldList, string>[];
        filter?: {
            id?: number[];
        };
    };
}

export const CountriesBodyParamsCodec: t.Type<CountriesBodyParams> = t.partial({
    query: t.partial({
        include: t.array(t.string),
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

    try {
        const response = await net.post(`${sdkConfig.baseUrl}discovery/countries`, {
            headers: {
                "Content-Type": "application/json",
            },
            json: countriesBodyParams,
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
    } catch (error) {
        handleServerResponse(error);
        throw error;
    }
};

export { queryCountries };
