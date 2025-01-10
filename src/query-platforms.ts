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

export interface Platform extends Record<string, unknown> {
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

export interface PlatformsBodyParams extends Record<string, unknown> {
    query?: {
        /**
         * Posible fields to include are defined in type PlatformsIncludeFieldList .
         */
        include?: LiteralUnion<PlatformsIncludeFieldList, string>[];
        filter?: {
            id?: number[];
        };
    };
}

const PlatformsBodyParamsCodec: t.Type<PlatformsBodyParams> = t.partial({
    query: t.partial({
        include: t.array(t.string),
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

    try {
        const response = await net.post(`${String(sdkConfig.baseUrl)}discovery/platforms`, {
            headers: {
                "Content-Type": "application/json",
            },
            json: platformsBodyParams,
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
    } catch (error) {
        handleServerResponse(error);
        throw error;
    }
};

export { queryPlatforms };
