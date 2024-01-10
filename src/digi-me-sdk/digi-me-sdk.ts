/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { DiscoveryAPIServicesData, DiscoveryAPIServicesResponse } from "../types/external/discovery-api-services";
import { GetAuthorizeUrlParameters } from "./get-authorize-url";
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

/**
 * Digi.me SDK
 */
export class DigiMeSdk {
    static #defaultJwksUrl = new URL("jwks/oauth", DEFAULT_BASE_URL).toString();
    static #jwksCache = new LRUCache<string, ReturnType<typeof createRemoteJWKSet>>({
        max: 10,
    });

    #config: DigiMeSdkConfig;

    constructor(sdkConfig: InputDigiMeSdkConfig) {
        this.#config = parseWithSchema(sdkConfig, DigiMeSdkConfig, 'DigiMeSDK constructor parameter "sdkConfig"');

        // Add the current instance's expected JWKS location to the JWKS cache
        DigiMeSdk.addUrlToJwksCache(new URL("/jwks/oauth", this.#config.baseUrl).toString());
    }

    static addUrlToJwksCache(url: string): void {
        const jwks = createRemoteJWKSet(new URL(url), { headers: { Accept: "application/json" } });
        DigiMeSdk.#jwksCache.set(url, jwks);
    }

    /**
     * TODO: Describe
     */
    static getJwksForUrl(url: string): ReturnType<typeof createRemoteJWKSet> {
        // Add the default JWKS as the most common use case
        if (!this.#jwksCache.has(this.#defaultJwksUrl)) {
            this.addUrlToJwksCache(this.#defaultJwksUrl);
        }

        const jwks = this.#jwksCache.get(url);

        if (!jwks) {
            throw new DigiMeSdkError("TODO: Explain");
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
    async getAvailableServices({
        contractId,
        signal,
    }: {
        contractId?: string;
        signal?: AbortSignal;
    } = {}): Promise<DiscoveryAPIServicesData> {
        // TODO: Parse parameters

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
     * TODO: Write docs for this
     */
    async getAuthorizeUrl(parameters: GetAuthorizeUrlParameters): Promise<GetAuthorizeUrlReturn> {
        const {
            callback,
            state,
            sessionOptions,
            serviceId,
            sourceType = "pull",
        } = parseWithSchema(parameters, GetAuthorizeUrlParameters);

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

        try {
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

            return {
                url: onboardUrl.toString(),
                codeVerifier,
                session: responseData.session,
            };
        } catch (error) {
            // TODO: Our errors
            console.log("=== e", error);
            throw error;
        }
    }

    async exchangeCodeForOauthToken(codeVerifier: string, authorizationCode: string): Promise<string> {
        // TODO: Better parameters
        // TODO: Validate parameters

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

        // eslint-disable-next-line no-useless-catch
        try {
            const response = await fetchWrapper(new URL("oauth/token", this.baseUrl), {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            const responseData = parseWithSchema(await response.json(), OauthTokenResponse);
            // TODO: Verify payload;
            // return await this.#getJkuVerifiedTokenPayload(responseData.token, TokenPair);
            return responseData.token;
        } catch (error) {
            // TODO: Do something useful here
            throw error;
        }
    }

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
}
