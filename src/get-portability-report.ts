/*!
 * © World Data Exchange. All rights reserved.
 */

import * as t from "io-ts";
import { getRandomAlphaNumeric } from "./crypto";
import { net } from "./net";
import { UserAccessToken, UserAccessTokenCodec } from "./types/user-access-token";
import { sign } from "jsonwebtoken";
import { SDKConfiguration } from "./types/sdk-configuration";
import { ContractDetails, ContractDetailsCodec } from "./types/common";

export type Format = "xml";

const FormatCodec: t.Type<Format> = t.keyof({
    xml: null,
});

export type ServiceType = "medmij";

const ServiceTypeCodec: t.Type<ServiceType> = t.keyof({
    medmij: null,
});

export interface GetPortabilityReportOptions {
    /**
     * File format to be returned. Currently only XML is supported.
     */
    format: Format;
    /**
     * Service type medmij is only supported for now.
     */
    serviceType: ServiceType;
    /**
     * Any contract related details here.
     */
    contractDetails: ContractDetails;
    /**
     * User access token you may already have for this user from this or from another contract.
     */
    userAccessToken: UserAccessToken;
    /**
     * From timestamp in seconds
     */
    from?: number;
    /**
     * To timestamp in seconds
     */
    to?: number;
}

export const GetPortabilityReportOptionsCodec: t.Type<GetPortabilityReportOptions> = t.intersection([
    t.type({
        contractDetails: ContractDetailsCodec,
        userAccessToken: UserAccessTokenCodec,
        format: FormatCodec,
        serviceType: ServiceTypeCodec,
    }),
    t.partial({
        from: t.number,
        to: t.number,
    }),
]);

export interface GetPortabilityReportResponse {
    file: string;
}

const getPortabilityReport = async (
    props: GetPortabilityReportOptions,
    sdkConfig: SDKConfiguration
): Promise<GetPortabilityReportResponse> => {
    const { to, from, contractDetails, userAccessToken, serviceType, format } = props;
    const { contractId, privateKey } = contractDetails;

    const response = await net.get(
        `${String(sdkConfig.baseUrl)}export/${serviceType}/report?format=${format}&from=${String(from)}&to=${String(to)}`,
        {
            headers: {
                accept: "application/octet-stream",
            },
            hooks: {
                beforeRequest: [
                    (options) => {
                        const jwt: string = sign(
                            {
                                access_token: userAccessToken.accessToken.value,
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
        }
    );

    return {
        file: response.body,
    };
};

export { getPortabilityReport };
