/*!
 * © World Data Exchange. All rights reserved.
 */

import * as t from "io-ts";
import get from "lodash.get";
import { getRandomAlphaNumeric } from "./crypto";
import { net } from "./net";
import { Session } from "./types/api/session";
import { UserAccessToken, UserAccessTokenCodec } from "./types/user-access-token";
import { sign } from "jsonwebtoken";
import { URL, URLSearchParams } from "node:url";
import { refreshTokenWrapper } from "./utils/refresh-token-wrapper";
import { getPayloadFromToken } from "./utils/get-payload-from-token";
import { SDKConfiguration } from "./types/sdk-configuration";
import {
    ContractDetails,
    ContractDetailsCodec,
    PullSessionOptions,
    PullSessionOptionsCodec,
    SampleDataOptions,
    SampleDataOptionsCodec,
    SourcesScope,
    SourcesScopeCodec,
    SourceType,
    SourceTypeCodec,
} from "./types/common";
import { TypeValidationError } from "./errors";
import { isNonEmptyString } from "./utils/basic-utils";
import sdkVersion from "./sdk-version";

export interface GetOnboardServiceUrlOptions {
    /**
     * Any contract related details here.
     */
    contractDetails: ContractDetails;
    /**
     * A URL to call to be called after authorization is done.
     */
    callback: string;
    /**
     * User access token you may already have for this user from this or from another contract.
     */
    userAccessToken: UserAccessToken;
    /**
     * Service ID to be added. If serviceId is not passed user will have option to choose service that will be added.
     */
    serviceId?: number;
    /**
     * Please use SourceType push to filter out only services that are push type. Default SourceType is set to pull.
     */
    sourceType?: SourceType;
    /**
     * Options for sample data flow
     */
    sampleData?: SampleDataOptions;
    /**
     * Any optional parameters for the share.
     */
    sessionOptions?: {
        pull?: PullSessionOptions;
    };
    /**
     * Send preferred locale for authorization client to be used.
     * If passed locale is not supported then language will fallback to browser language.
     * If browser locale is not supported we will fallback to default locale (en).
     */
    locale?: string;
    /**
     * Flag to indicate if we should include services that are sample data only services. Default is false.
     */
    includeSampleDataOnlySources?: boolean;
    /**
     * Flag to indicate if data query will be triggered post service authorisation. Default is true.
     * If this is set to false data for added service will not be returned.
     * You may want to set to false when adding multiple services subsequently and only get data for all services when adding last service.
     */
    triggerQuery?: boolean;
    /**
     * Options that is used to scope list of available sources during process of adding sources.
     * Currently this is only used for data types but will be used for other params as well.
     */
    sourcesScope?: SourcesScope;
    /**
     * Any extra data you want to be passed back after a authorization flow.
     */
    state?: string;
}

const GetOnboardServiceUrlCodec: t.Type<GetOnboardServiceUrlOptions> = t.intersection([
    t.type({
        contractDetails: ContractDetailsCodec,
        callback: t.string,
        userAccessToken: UserAccessTokenCodec,
    }),
    t.partial({
        serviceId: t.number,
        sourceType: SourceTypeCodec,
        sampleData: SampleDataOptionsCodec,
        sessionOptions: t.partial({
            pull: PullSessionOptionsCodec,
        }),
        locale: t.string,
        includeSampleDataOnlySources: t.boolean,
        triggerQuery: t.boolean,
        sourcesScope: SourcesScopeCodec,
        state: t.string,
    }),
]);

export interface GetOnboardServiceUrlResponse {
    session: Session;
    userAccessToken: UserAccessToken;
    url: string;
}

const _getOnboardServiceUrl = async (
    props: GetOnboardServiceUrlOptions,
    sdkConfig: SDKConfiguration
): Promise<GetOnboardServiceUrlResponse> => {
    if (!GetOnboardServiceUrlCodec.is(props) || !isNonEmptyString(props.callback)) {
        throw new TypeValidationError("Error on getOnboardServiceUrl(). Incorrect parameters passed in.");
    }

    const {
        userAccessToken,
        contractDetails,
        callback,
        sourceType,
        sampleData,
        sessionOptions,
        locale,
        includeSampleDataOnlySources,
        serviceId,
        triggerQuery,
        sourcesScope,
        state,
    } = props;
    const { contractId, privateKey } = contractDetails;

    const response = await net.post(`${String(sdkConfig.baseUrl)}oauth/token/reference`, {
        headers: {
            "Content-Type": "application/json",
        },
        json: {
            agent: {
                sdk: {
                    name: "nodejs",
                    version: sdkVersion,
                    meta: {
                        node: process.version,
                    },
                },
            },
            actions: sessionOptions,
        },
        responseType: "json",
        hooks: {
            beforeRequest: [
                (options) => {
                    const jwt: string = sign(
                        {
                            access_token: userAccessToken.accessToken.value,
                            client_id: `${sdkConfig.applicationId}_${contractId}`,
                            nonce: getRandomAlphaNumeric(32),
                            redirect_uri: callback,
                            state,
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

    const payload = await getPayloadFromToken(get(response.body, "token"), sdkConfig);
    const code = get(payload, ["reference_code"]);
    const session = get(response.body, "session", {} as GetOnboardServiceUrlResponse["session"]);

    const result: URL = new URL(`${String(sdkConfig.onboardUrl)}onboard`);

    result.search = new URLSearchParams({
        code,
        sourceType: sourceType || "pull",
        ...(serviceId && { service: serviceId.toString() }),
        ...(sampleData && sampleData.dataSet && { sampleDataSet: sampleData.dataSet }),
        ...(sampleData && sampleData.autoOnboard && { sampleDataAutoOnboard: sampleData.autoOnboard.toString() }),
        ...(locale && { lng: locale }),
        ...(includeSampleDataOnlySources !== undefined && {
            includeSampleDataOnlySources: includeSampleDataOnlySources.toString(),
        }),
        ...(triggerQuery !== undefined && {
            triggerQuery: triggerQuery.toString(),
        }),
        ...(sourcesScope && { sourcesScope: encodeURIComponent(JSON.stringify(sourcesScope)) }),
    }).toString();

    return {
        url: result.toString(),
        session,
        userAccessToken: props.userAccessToken,
    };
};

const getOnboardServiceUrl = async (
    props: GetOnboardServiceUrlOptions,
    sdkConfiguration: SDKConfiguration
): Promise<GetOnboardServiceUrlResponse> => {
    return refreshTokenWrapper(_getOnboardServiceUrl, props, sdkConfiguration);
};

export { getOnboardServiceUrl };
