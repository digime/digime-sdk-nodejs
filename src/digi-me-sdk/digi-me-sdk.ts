/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { DiscoveryAPIServicesData, DiscoveryAPIServicesResponse } from "../types/external/discovery-api-services";
import { GetAuthorizeUrlParameters, GetAuthorizeUrlParametersInput } from "./get-authorize-url";
import { getRandomAlphaNumeric, getSha256Hash, toBase64Url } from "../crypto";
import SDK_VERSION from "../sdk-version";
import { OauthAuthorizeResponse } from "../types/external/oauth-authorize";
import { PayloadPreauthorizationCode } from "../types/external/jwt-payloads";
import { GetAuthorizeUrlReturn } from "./get-authorize-url";
import { OauthTokenResponse } from "../types/external/oauth-token";
import { parseWithSchema } from "../zod/zod-parse";
import { DigiMeSdkConfig, InputDigiMeSdkConfig } from "./config";
import { fetchWrapper } from "../fetch/fetch";
import { signTokenPayload } from "../sign-token-payload";
import { UserAuthorization } from "../user-authorization";
import { getVerifiedTokenPayload } from "../get-verified-token-payload";
import { GetAvailableServicesParameters } from "./get-available-services";
import { GetSampleDataSetsForSourceParameters, SampleDataSets } from "./get-sample-data-sets-for-source";
import { ExchangeCodeForUserAuthorizationParameters } from "./exchange-code-for-user-authorization";
import { RefreshUserAuthorizationParameters } from "./refresh-user-authorization";
import { TrustedJwks } from "../trusted-jwks";

/**
 * Digi.me SDK
 */
export class DigiMeSdk {
    #config: DigiMeSdkConfig;

    constructor(sdkConfig: InputDigiMeSdkConfig) {
        this.#config = parseWithSchema(sdkConfig, DigiMeSdkConfig, 'DigiMeSDK constructor parameter "sdkConfig"');

        // Add the current instance's expected JWKS location to the JWKS cache
        TrustedJwks.addUrlAsTrustedJwks(new URL("/jwks/oauth", this.#config.baseUrl).toString());
    }

    /**
     * The `applicationId` this instance has been instantiated with
     */
    public get applicationId() {
        return this.#config.applicationId;
    }

    /**
     * The `contractId` this instance has been instantiated with
     */
    public get contractId() {
        return this.#config.contractId;
    }

    /**
     * The `contractPrivateKey` this instance has been instantiated with
     */
    public get contractPrivateKey() {
        return this.#config.contractPrivateKey;
    }

    /**
     * The `baseUrl` this instance has been instantiated with
     */
    public get baseUrl() {
        return this.#config.baseUrl;
    }

    /**
     * The `onboardUrl` this instance has been instantiated with
     */
    public get onboardUrl() {
        return this.#config.onboardUrl;
    }

    /**
     * Retrieve available services from the Digi.me Discovery API
     *
     * By default, it will return ALL the onboardable services
     *
     * However, if you pass in the `contractId` parameter, Digi.me Discovery API will instead
     * return only the services that can be onboarded with the provided contract
     */
    async getAvailableServices(parameters: GetAvailableServicesParameters = {}): Promise<DiscoveryAPIServicesData> {
        const { contractId, signal } = parseWithSchema(
            parameters,
            GetAvailableServicesParameters,
            "`getAvailableServices` parameters",
        );

        const headers: HeadersInit = {
            Accept: "application/json",
        };

        if (contractId) {
            headers.contractId = contractId;
        }

        const response = await fetchWrapper(new URL("discovery/services", this.baseUrl), {
            headers,
            signal,
        });

        return parseWithSchema(await response.json(), DiscoveryAPIServicesResponse).data;
    }

    /**
     * TODO: Explain better. Rename? Reimplement better?
     *
     * Returns an object with the following:
     * - `url` - A URL you should redirect to for user authorization an onboarding
     * - `codeVerifier` - You should keep, as it will be needed later to exchange for `UserAuthorization`
     * - `session` - You should keep, as it will be needed later to access the data user has authorized access to
     */
    async getAuthorizeUrl(parameters: GetAuthorizeUrlParametersInput): Promise<GetAuthorizeUrlReturn> {
        const {
            callback,
            state,
            sessionOptions,
            serviceId,
            sourceType,
            preferredLocale,
            includeSampleDataOnlySources,
            signal,
        } = parseWithSchema(parameters, GetAuthorizeUrlParameters, "`getAuthorizeUrl` parameters");

        const codeVerifier = toBase64Url(getRandomAlphaNumeric(32));

        const tokenPayload: Record<string, unknown> = {
            client_id: `${this.applicationId}_${this.contractId}`,
            code_challenge: toBase64Url(getSha256Hash(codeVerifier)),
            code_challenge_method: "S256",
            nonce: getRandomAlphaNumeric(32),
            redirect_uri: callback,
            response_mode: "query",
            response_type: "code",
            state,
            timestamp: Date.now(),
        };

        // TODO: Reimplement this?
        // if (this.#oauthToken) {
        //     tokenPayload.access_token = (await DigiMeSdk.getOauthTokenPayload(this.#oauthToken)).access_token.value;
        // }

        const token = await signTokenPayload(tokenPayload, this.contractPrivateKey);

        const response = await fetchWrapper(new URL("oauth/authorize", this.baseUrl), {
            signal,
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                agent: {
                    sdk: {
                        name: "nodejs",
                        version: SDK_VERSION,
                        meta: {
                            node: process.version,
                        },
                    },
                },
                actions: sessionOptions,
            }),
        });

        // Process response data
        const responseData = parseWithSchema(await response.json(), OauthAuthorizeResponse);
        const preauthTokenPayload = await getVerifiedTokenPayload(responseData.token, PayloadPreauthorizationCode);

        // Set up onboard URL
        const onboardUrl = new URL(`authorize`, this.onboardUrl);
        onboardUrl.searchParams.set("code", preauthTokenPayload.preauthorization_code);
        onboardUrl.searchParams.set("sourceType", sourceType);
        if (serviceId) onboardUrl.searchParams.set("service", serviceId.toString());
        if (preferredLocale) onboardUrl.searchParams.set("lng", preferredLocale);
        if (typeof includeSampleDataOnlySources !== "undefined") {
            onboardUrl.searchParams.set("includeSampleDataOnlySources", String(includeSampleDataOnlySources));
        }

        return {
            url: onboardUrl.toString(),
            codeVerifier,
            session: responseData.session,
        };
    }

    /**
     * Exchange `codeVerifier` and `authorizationCode` you received from the `getAuthorizeUrl` call and
     * the callback provided to it for UserAuthorization.
     */
    async exchangeCodeForUserAuthorization(
        parameters: ExchangeCodeForUserAuthorizationParameters,
    ): Promise<UserAuthorization> {
        const { codeVerifier, authorizationCode, signal } = parseWithSchema(
            parameters,
            ExchangeCodeForUserAuthorizationParameters,
            "`exchangeCodeForUserAuthorization` parameters",
        );

        const token = await signTokenPayload(
            {
                client_id: `${this.applicationId}_${this.contractId}`,
                code: authorizationCode,
                code_verifier: codeVerifier,
                grant_type: "authorization_code",
                nonce: getRandomAlphaNumeric(32),
                timestamp: Date.now(),
            },
            this.contractPrivateKey,
        );

        const response = await fetchWrapper(new URL("oauth/token", this.baseUrl), {
            signal,
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
        });

        const responseData = parseWithSchema(await response.json(), OauthTokenResponse);
        return UserAuthorization.fromJwt(responseData.token);
    }

    /**
     * Attempt to refresh any instance of a UserAuthorization and recieve a new one in return
     */
    async refreshUserAuthorization(parameters: RefreshUserAuthorizationParameters): Promise<UserAuthorization> {
        const { userAuthorization, signal } = parseWithSchema(
            parameters,
            RefreshUserAuthorizationParameters,
            "`refreshUserAuthorization` parameters",
        );

        const signedToken = await signTokenPayload(
            {
                client_id: `${this.applicationId}_${this.contractId}`,
                grant_type: "refresh_token",
                nonce: getRandomAlphaNumeric(32),
                refresh_token: userAuthorization.asPayload().refresh_token.value,
                timestamp: Date.now(),
            },
            this.contractPrivateKey,
        );

        const response = await fetchWrapper(new URL("oauth/token", this.baseUrl), {
            signal,
            method: "POST",
            headers: {
                Authorization: `Bearer ${signedToken}`,
                Accept: "application/json",
            },
        });

        const responseData = parseWithSchema(await response.json(), OauthTokenResponse);
        return UserAuthorization.fromJwt(responseData.token);
    }

    /**
     * Retrieve available sample datasets for a given source
     */
    async getSampleDataSetsForSource(parameters: GetSampleDataSetsForSourceParameters): Promise<SampleDataSets> {
        const { sourceId, signal } = parseWithSchema(
            parameters,
            GetSampleDataSetsForSourceParameters,
            "`getSampleDataSetsForSource` parameters",
        );

        const signedToken = await signTokenPayload(
            {
                client_id: `${this.applicationId}_${this.contractId}`,
                nonce: getRandomAlphaNumeric(32),
                timestamp: Date.now(),
            },
            this.contractPrivateKey,
        );

        const response = await fetchWrapper(new URL(`permission-access/sample/datasets/${sourceId}`, this.baseUrl), {
            signal,
            headers: {
                Authorization: `Bearer ${signedToken}`,
                Accept: "application/json",
            },
        });

        return parseWithSchema(await response.json(), SampleDataSets);
    }
}
