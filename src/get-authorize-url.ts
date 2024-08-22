/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { URL, URLSearchParams } from "url";
import { getPayloadFromToken } from "./utils/get-payload-from-token";
import { TypeValidationError } from "./errors";
import { Session } from "./types/api/session";
import { UserAccessToken, UserAccessTokenCodec } from "./types/user-access-token";
import * as t from "io-ts";
import base64url from "base64url";
import { getRandomAlphaNumeric, hashSha256 } from "./crypto";
import { sign } from "jsonwebtoken";
import { handleServerResponse, net } from "./net";
import get from "lodash.get";
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
import { isNonEmptyString } from "./utils/basic-utils";
import sdkVersion from "./sdk-version";

export interface GetAuthorizeUrlOptions {
    /**
     * Any contract related details here.
     */
    contractDetails: ContractDetails;

    /**
     * A URL to call to be called after authorization is done.
     */
    callback: string;

    /**
     * Onboard a service while authorizing.
     */
    serviceId?: number;

    /**
     * User access token you may already have for this user from this or from another contract.
     */
    userAccessToken?: UserAccessToken;

    /**
     * Any optional parameters for the share.
     */
    sessionOptions?: {
        pull?: PullSessionOptions;
    };

    /**
     * Any extra data you want to be passed back after a authorization flow.
     */
    state: string;

    /**
     * Please use SourceType push to filter out only services that are push type. Default SourceType is set to pull.
     */
    sourceType?: SourceType;

    /**
     * Options for sample data flow
     */
    sampleData?: SampleDataOptions;

    /**
     * Send prefared locale for authorization client to be used.
     * If passed locale is not supported then language will fallback to browser language.
     * If browser locale is not supported we will fallback to default locale (en).
     */
    locale?: string;

    /**
     * Flag to indicate if we should include sample data only sources. Default is false.
     */
    includeSampleDataOnlySources?: boolean;

    /**
     * Provide storage.id returned createProvisionalStorage to connect this storage to created user
     */
    storageId?: string;

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
}

export const GetAuthorizeUrlOptionsCodec: t.Type<GetAuthorizeUrlOptions> = t.intersection([
    t.type({
        contractDetails: ContractDetailsCodec,
        callback: t.string,
        state: t.string,
    }),
    t.partial({
        serviceId: t.number,
        userAccessToken: UserAccessTokenCodec,
        sessionOptions: t.partial({
            pull: PullSessionOptionsCodec,
        }),
        sourceType: SourceTypeCodec,
        sampleData: SampleDataOptionsCodec,
        locale: t.string,
        includeSampleDataOnlySources: t.boolean,
        storageId: t.string,
        triggerQuery: t.boolean,
        sourcesScope: SourcesScopeCodec,
    }),
]);

export interface GetAuthorizeUrlResponse {
    /**
     * The URL to redirect users to to trigger the authorization process.
     */
    url: string;

    /**
     * A string that will be required when exchanging for an user access token
     */
    codeVerifier: string;

    /**
     * A session that can be used to read data. Can only be used after a successful authorization
     */
    session: Session;
}

/**
 * getAuthorizeUrl()
 * A function to call to kick start the authorization process.
 */
const getAuthorizeUrl = async (
    props: GetAuthorizeUrlOptions,
    sdkConfig: SDKConfiguration
): Promise<GetAuthorizeUrlResponse> => {
    if (!GetAuthorizeUrlOptionsCodec.is(props) || !isNonEmptyString(props.callback)) {
        // tslint:disable-next-line:max-line-length
        throw new TypeValidationError(
            "Parameters failed validation. props should be a plain object that contains the properties contractDetails and callback."
        );
    }

    const { code, codeVerifier, session } = await _authorize(props, sdkConfig);
    const { serviceId, sourceType, sampleData, locale, includeSampleDataOnlySources, triggerQuery, sourcesScope } =
        props;

    let storageRef = undefined;
    if (props.storageId) {
        storageRef = await _storageReference(props, sdkConfig);
    }

    const result: URL = new URL(`${sdkConfig.onboardUrl}authorize`);
    result.search = new URLSearchParams({
        code,
        sourceType: sourceType ? sourceType : "pull",
        ...(serviceId && { service: serviceId.toString() }),
        ...(sampleData && sampleData.dataSet && { sampleDataSet: sampleData.dataSet }),
        ...(sampleData && sampleData.autoOnboard && { sampleDataAutoOnboard: sampleData.autoOnboard.toString() }),
        ...(locale && { lng: locale }),
        ...(includeSampleDataOnlySources !== undefined && {
            includeSampleDataOnlySources: includeSampleDataOnlySources.toString(),
        }),
        ...(storageRef && { storageRef: storageRef }),
        ...(triggerQuery !== undefined && {
            triggerQuery: triggerQuery.toString(),
        }),
        ...(sourcesScope && { sourcesScope: encodeURIComponent(JSON.stringify(sourcesScope)) }),
    }).toString();

    return {
        url: result.toString(),
        codeVerifier,
        session,
    };
};

interface AuthorizeResponse {
    codeVerifier: string;
    code: string;
    session: Session;
}

const _authorize = async (
    { contractDetails, sessionOptions, state, userAccessToken, callback }: GetAuthorizeUrlOptions,
    sdkConfig: SDKConfiguration
): Promise<AuthorizeResponse> => {
    const { contractId, privateKey } = contractDetails;
    let codeVerifier: string = "";
    try {
        const { body } = await net.post(`${sdkConfig.baseUrl}oauth/authorize`, {
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
            retry: sdkConfig.retryOptions,
            hooks: {
                beforeRequest: [
                    (options) => {
                        codeVerifier = base64url(getRandomAlphaNumeric(32));
                        const jwt: string = sign(
                            {
                                access_token: userAccessToken?.accessToken.value,
                                client_id: `${sdkConfig.applicationId}_${contractId}`,
                                code_challenge: base64url(hashSha256(codeVerifier)),
                                code_challenge_method: "S256",
                                nonce: getRandomAlphaNumeric(32),
                                redirect_uri: callback,
                                response_mode: "query",
                                response_type: "code",
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

        const payload = await getPayloadFromToken(get(body, "token"), sdkConfig);

        const session = get(body, "session", {} as AuthorizeResponse["session"]);

        return {
            codeVerifier,
            code: `${get(payload, ["preauthorization_code"])}`,
            session,
        };
    } catch (error) {
        handleServerResponse(error);
        throw error;
    }
};

const _storageReference = async (
    { storageId, contractDetails }: GetAuthorizeUrlOptions,
    sdkConfig: SDKConfiguration
): Promise<string> => {
    const { contractId, privateKey } = contractDetails;
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
    try {
        const { body } = await net.post(`${sdkConfig.baseUrl}reference`, {
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
            json: {
                type: "cloudId",
                value: storageId,
            },
            responseType: "json",
        });

        const ref = get(body, "id", {} as string);

        return ref;
    } catch (error) {
        handleServerResponse(error);
        throw error;
    }
};

export { getAuthorizeUrl };
