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

export type ContractAccessType = "r" | "w";

export interface ContractApplication {
    id: string;
    name: string;
    resources: Record<string, unknown>;
    status: number;
}

const ContractApplicationCodec: t.Type<ContractApplication> = t.type({
    id: t.string,
    name: t.string,
    resources: t.record(t.string, t.unknown),
    status: t.number,
});

export interface GetContractDetailsResponse {
    accessType: ContractAccessType;
    application: ContractApplication;
    certificate: string;
    certificateContractSchemaVersion: string;
    expirationDate: number;
    id: string;
    partnerId: string;
    type: string;
}

const GetContractDetailsResponseCodec: t.Type<GetContractDetailsResponse> = t.type({
    accessType: t.union([t.literal("r"), t.literal("w")]),
    application: ContractApplicationCodec,
    certificate: t.string,
    certificateContractSchemaVersion: t.string,
    expirationDate: t.number,
    id: t.string,
    partnerId: t.string,
    type: t.string,
});

export interface GetContractDetailsOptions {
    /**
     * Contract details here.
     */
    contractDetails: ContractDetails;
}

const GetContractDetailsOptionsCodec: t.Type<GetContractDetailsOptions> = t.type({
    contractDetails: ContractDetailsCodec,
});

const assertIsGetContractDetailsResponse: CodecAssertion<GetContractDetailsResponse> = codecAssertion(
    GetContractDetailsResponseCodec
);

const getContractDetails = async (
    options: GetContractDetailsOptions,
    sdkConfig: SDKConfiguration
): Promise<GetContractDetailsResponse> => {
    if (!GetContractDetailsOptionsCodec.is(options)) {
        throw new TypeValidationError(
            "Parameters failed validation. Params should be defined as outlined in GetContractDetailsOptions type"
        );
    }

    const { contractDetails } = options;
    const { contractId, privateKey } = contractDetails;

    try {
        const response = await net.get(`${String(sdkConfig.baseUrl)}permission-access/contract`, {
            headers: {
                "Content-Type": "application/json",
            },
            responseType: "json",
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

        assertIsGetContractDetailsResponse(response.body);

        return {
            ...response.body,
        };
    } catch (error) {
        handleServerResponse(error);
        throw error;
    }
};

export { getContractDetails };
