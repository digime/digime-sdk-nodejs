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
import { DEFAULT_BASE_URL, DigiMeSdkConfig, InputDigiMeSdkConfig } from "./config";
import { fetchWrapper } from "../fetch/fetch";
import { signTokenPayload } from "../sign-token-payload";
import { UserAuthorization } from "../user-authorization";
import { createRemoteJWKSet } from "jose";
import { LRUCache } from "lru-cache";
import { getVerifiedTokenPayload } from "../get-verified-token-payload";
import { DigiMeSdkError } from "../errors/errors";
import { GetAvailableServicesParameters } from "./get-available-services";
import { z } from "zod";
import { errorMessages } from "../errors/messages";

/**
 * Digi.me SDK
 */
export class DigiMeSdk {
    static #defaultTrustedJwksUrl = new URL("jwks/oauth", DEFAULT_BASE_URL).toString();
    static #trustedJwksCache = new LRUCache<string, ReturnType<typeof createRemoteJWKSet>>({
        max: 10,
    });

    #config: DigiMeSdkConfig;

    constructor(sdkConfig: InputDigiMeSdkConfig) {
        this.#config = parseWithSchema(sdkConfig, DigiMeSdkConfig, 'DigiMeSDK constructor parameter "sdkConfig"');

        // Add the current instance's expected JWKS location to the JWKS cache
        DigiMeSdk.addUrlAsTrustedJwks(new URL("/jwks/oauth", this.#config.baseUrl).toString());
    }

    /**
     * Adds the URL as a trusted JWKS URL
     * - JWT verifications via JKU will fail if they reference an untrusted JWKS URL
     * - Default Digi.me OAuth JWKS URL is trusted by default, and it doesn't need to be manually added
     * - When a new `DigiMeSdk` instance is created, `<instance base url>/jwks/oauth` is automatically added as a trusted JWKS URL
     */
    static addUrlAsTrustedJwks(url: string): void {
        url = parseWithSchema(url, z.string().url(), "`url` argument");
        const jwks = createRemoteJWKSet(new URL(url), { headers: { Accept: "application/json" } });
        DigiMeSdk.#trustedJwksCache.set(url, jwks);
    }

    /**
     * Retrieves a JWKS key resolver for a given URL.
     * - URL must be first added with the `DigiMeSdk.addUrlAsTrustedJwks()` method
     */
    static getJwksKeyResolverForUrl(url: string): ReturnType<typeof createRemoteJWKSet> {
        url = parseWithSchema(url, z.string().url(), "`url` argument");

        // Add the default JWKS as the most common use case
        if (!this.#trustedJwksCache.has(this.#defaultTrustedJwksUrl)) {
            this.addUrlAsTrustedJwks(this.#defaultTrustedJwksUrl);
        }

        const jwks = this.#trustedJwksCache.get(url);

        if (!jwks) {
            throw new DigiMeSdkError(errorMessages.gettingUntrustedJwksKeyResolver);
        }

        return jwks;
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
        const { contractId, signal } = parseWithSchema(parameters, GetAvailableServicesParameters);

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
        /** codeVerifier received as a result of `getAuthorizeUrl` call */
        codeVerifier: string,

        /** authorizationCode received by the callback you provided to `getAuthorizeUrl` */
        authorizationCode: string,
    ): Promise<UserAuthorization> {
        // Parse and validate parameters
        codeVerifier = parseWithSchema(codeVerifier, z.string());
        authorizationCode = parseWithSchema(authorizationCode, z.string());

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
    async refreshUserAuthorization(userAuthorization: UserAuthorization): Promise<UserAuthorization> {
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
            method: "POST",
            headers: {
                Authorization: `Bearer ${signedToken}`,
                Accept: "application/json",
            },
        });

        const responseData = parseWithSchema(await response.json(), OauthTokenResponse);
        return UserAuthorization.fromJwt(responseData.token);
    }

    async getSampleDataSetsForSource(sourceId: number) {
        // TODO
        console.log("sourceId", sourceId);
    }
}
