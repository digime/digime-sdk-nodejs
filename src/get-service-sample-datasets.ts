/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { net } from "./net";
import { sign } from "jsonwebtoken";
import { getRandomAlphaNumeric } from "./crypto";
import { SDKConfiguration } from "./types/sdk-configuration";
import { ContractDetails, ContractDetailsCodec } from "./types/common";
import * as t from "io-ts";
import { DigiMeSDKError, TypeValidationError } from "./errors";
import { CodecAssertion, codecAssertion } from "./utils/codec-assertion";

export interface GetServiceSampleDataSetsOptions {
    contractDetails: ContractDetails;
    sourceId: number;
}

export const ServiceSampleDataSetsOptionsOptionsCodec: t.Type<GetServiceSampleDataSetsOptions> = t.type({
    contractDetails: ContractDetailsCodec,
    sourceId: t.number,
});

type DataSet = {
    description: string;
    name: string;
};

const DataSetCodec = t.type({
    description: t.string,
    name: t.string,
});

export type GetServiceSampleDataSetsResponse = {
    [key: string]: DataSet;
};

const GetServiceSampleDataSetsResponseCodec = t.record(t.string, DataSetCodec);

export const assertIsDataSetsResponse: CodecAssertion<GetServiceSampleDataSetsResponse> = codecAssertion(
    GetServiceSampleDataSetsResponseCodec
);

const getServiceSampleDataSets = async (
    options: GetServiceSampleDataSetsOptions,
    sdkConfig: SDKConfiguration
): Promise<GetServiceSampleDataSetsResponse> => {
    if (!ServiceSampleDataSetsOptionsOptionsCodec.is(options)) {
        throw new TypeValidationError(
            "Parameters failed validation. props should be a plain object that contains the properties contractDetails and sourceId"
        );
    }

    const { contractDetails, sourceId } = options;
    const { contractId, privateKey } = contractDetails;

    try {
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

        const url = `${sdkConfig.baseUrl}permission-access/sample/datasets/${sourceId}`;

        const response = await net.get(url, {
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
            responseType: "json",
            retry: sdkConfig.retryOptions,
        });

        const datasets = response.body;

        assertIsDataSetsResponse(datasets);

        return datasets;
    } catch (error) {
        throw new DigiMeSDKError("Problem with getting service data sets");
    }
};

export { getServiceSampleDataSets };
