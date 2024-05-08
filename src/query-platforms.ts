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

export interface Platform {
    id: number;
    name?: string;
    reference?: string;
}

const PlatformCodec: t.Type<Platform> = t.intersection([
    t.type({
        id: t.number,
    }),
    t.partial({
        reference: t.string,
        name: t.string,
    }),
]);

export interface QueryPlatformsResponse {
    /**
     * List of countries
     */
    data: Platform[];
}

export type PlatformsIncludeFieldList = "id" | "name" | "reference";

const PlatformsIncludeFieldListCodec: t.Type<PlatformsIncludeFieldList> = t.union([
    t.literal("id"),
    t.literal("name"),
    t.literal("reference"),
]);

export interface PlatformsBodyParams {
    query?: {
        /**
         * Posible fields to include are defined in type PlatformsIncludeFieldList .
         */
        include?: PlatformsIncludeFieldList[];
        filter?: {
            id?: number[];
        };
    };
}

const PlatformsBodyParamsCodec: t.Type<PlatformsBodyParams> = t.partial({
    query: t.partial({
        include: t.array(PlatformsIncludeFieldListCodec),
    }),
});

export interface QueryPlatformsOptions {
    /**
     * Contract details here.
     */
    contractDetails: ContractDetails;
    /**
     * Additional query options.
     */
    platformsBodyParams?: PlatformsBodyParams;
}

const QueryPlatformsOptionsCodec: t.Type<QueryPlatformsOptions> = t.intersection([
    t.type({
        contractDetails: ContractDetailsCodec,
    }),
    t.partial({
        platformsBodyParams: PlatformsBodyParamsCodec,
    }),
]);

const QueryPlatformsResponseCodec: t.Type<QueryPlatformsResponse> = t.type({
    data: t.array(PlatformCodec),
});

const assertIsPlatformsApiData: CodecAssertion<QueryPlatformsResponse> = codecAssertion(QueryPlatformsResponseCodec);

const queryPlatforms = async (
    options: QueryPlatformsOptions,
    sdkConfig: SDKConfiguration
): Promise<QueryPlatformsResponse> => {
    if (!QueryPlatformsOptionsCodec.is(options)) {
        throw new TypeValidationError(
            "Parameters failed validation. Params should be defined as outlined in QueryPlatformsOptions type"
        );
    }

    const { contractDetails, platformsBodyParams } = options;
    const { contractId, privateKey } = contractDetails;

    // set body params
    const bodyParams: PlatformsBodyParams = {
        query: {
            include: platformsBodyParams?.query?.include || ["id", "name", "reference"],
            filter: {
                ...(platformsBodyParams?.query?.filter?.id && { id: platformsBodyParams?.query?.filter?.id }),
            },
        },
    };

    const response = await net.post(`${sdkConfig.baseUrl}discovery/platforms`, {
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

    assertIsPlatformsApiData(response.body);

    return {
        ...response.body,
    };
};

export { queryPlatforms };
