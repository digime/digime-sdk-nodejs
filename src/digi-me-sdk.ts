/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import JWT from "jsonwebtoken";
import { SdkConfig, StoredSdkConfig } from "./types/digimesdk/sdk-config";
import { DiscoveryAPIServicesData, DiscoveryAPIServicesResponse } from "./types/external/discovery-api-services";
import { GetAuthorizeUrlParameters } from "./types/digimesdk/get-authorize-url";
import { getRandomAlphaNumeric, getSha256Hash, toBase64Url } from "./crypto";
import SDK_VERSION from "./sdk-version";
import { OauthAuthorizeResponse } from "./types/external/oauth-authorize";
import { JWKS } from "./types/external/jwks";
import { PayloadPreauthorizationCode } from "./types/external/jwt-payloads";
import { GetAuthorizeUrlReturn } from "./types/digimesdk/get-authorize-url";
import { ContractDetails } from "./types/contract-details";
import { TokenPair } from "./types/external/tokens";
import NodeRSA from "node-rsa";
import { z } from "zod";
import { OauthTokenResponse } from "./types/external/oauth-token";
import { fetch } from "./fetch/fetch";
import { parseWithSchema } from "./zod/zod-parse";
import { DigiMeSdkTypeError } from "./errors/errors";
import { errorMessages } from "./errors/messages";

/**
 * Digi.me SDK
 */
export class DigiMeSDK {
    static #fetch = fetch;
    #config: StoredSdkConfig;
    #contractDetails: ContractDetails | undefined;
    #tokenPair: TokenPair | undefined;

    constructor(sdkConfig: SdkConfig) {
        const { contractDetails, tokenPair, ...parsedConfig } = parseWithSchema(
            sdkConfig,
            SdkConfig,
            'DigiMeSDK constructor parameter "sdkConfig"',
        );

        this.#contractDetails = contractDetails;
        this.#tokenPair = tokenPair;
        this.#config = {
            baseURL: "https://api.digi.me/v1.7/",
            onboardURL: "https://api.digi.me/apps/saas/",
            onTokenPairRefreshed: () => {},
            ...parsedConfig,
        };
    }

    async #validTokenPairOrThrow() {
        if (!this.#tokenPair) {
            throw new DigiMeSdkTypeError(errorMessages.noTokenPairProvided);
        }

        const now = Math.floor(Date.now() / 1000);
        const accessTokenExpired = this.#tokenPair.access_token.expires_on + 10 > now;

        if (!accessTokenExpired) {
            return this.#tokenPair;
        }

        const refreshTokenExpired = this.#tokenPair.refresh_token.expires_on + 10 > now;

        if (refreshTokenExpired) {
            throw new DigiMeSdkTypeError(errorMessages.accessAndRefreshTokenExpired);
        }

        return await this.#refreshTokenPair();
    }

    async #refreshTokenPair() {
        if (!this.#contractDetails) {
            throw new DigiMeSdkTypeError(errorMessages.noContractDetailsProvided);
        }

        if (!this.#tokenPair) {
            throw new DigiMeSdkTypeError(errorMessages.noTokenPairProvided);
        }

        const signedToken = this.#signTokenPayload({
            client_id: `${this.#config.applicationId}_${this.#contractDetails.contractId}`,
            grant_type: "refresh_token",
            nonce: getRandomAlphaNumeric(32),
            refresh_token: this.#tokenPair.refresh_token.value,
            timestamp: Date.now(),
        });

        const response = await DigiMeSDK.#fetch(new URL("oauth/token", this.#config.baseURL), {
            method: "POST",
            headers: {
                Authorization: `Bearer ${signedToken}`,
                Accept: "application/json",
            },
        });

        const responseData = OauthTokenResponse.parse(await response.json());
        const payload = await this.#getJkuVerifiedTokenPayload(responseData.token, TokenPair);

        // Call the refresh hook with the tokens
        if (this.#config.onTokenPairRefreshed) {
            this.#config.onTokenPairRefreshed({ outdatedTokenPair: this.#tokenPair, newTokenPair: payload });
        }

        // Update the token pair bound to the instance
        this.#tokenPair = payload;

        return this.#tokenPair;
    }

    setDummyCredentials() {
        const testPrivateKey = new NodeRSA({ b: 2048 });

        this.#contractDetails = {
            contractId: "test-contract-id",
            privateKey: testPrivateKey.exportKey("pkcs1-private-pem").toString(),
        };

        this.#tokenPair = {
            access_token: {
                value: "test-access-token",
                expires_on: Infinity,
            },
            refresh_token: {
                value: "test-access-token",
                expires_on: Infinity,
            },
        };

        return this;
    }

    /**
     * TODO
     */
    setContractDetails(details: ContractDetails) {
        this.#contractDetails = details;
        return this;
    }

    /**
     * TODO
     */
    setTokenPair(tokenPair: TokenPair) {
        this.#tokenPair = tokenPair;
        return this;
    }

    /**
     * Calls JWT.sign with some recurring default parameters
     */
    #signTokenPayload(
        payload: Record<string, unknown>,
        secret: JWT.Secret | undefined = this.#contractDetails?.privateKey,
        options?: JWT.SignOptions,
    ) {
        if (!secret) {
            throw new DigiMeSdkTypeError('Not secret provided to ".#signTokenPayload()"');
        }

        return JWT.sign(payload, secret, {
            algorithm: "PS512",
            noTimestamp: true,
            ...options,
        });
    }

    /**
     * Retrieve unverified payload from a given token
     */
    #decodeToken(token: string): unknown;
    #decodeToken<T extends z.ZodTypeAny>(token: string, payloadSchema: T): z.infer<T>;
    #decodeToken<T extends z.ZodTypeAny>(token: string, payloadSchema?: T): z.infer<T> {
        return (payloadSchema ?? z.record(z.unknown())).parse(JWT.decode(token, { complete: true }));
    }

    /**
     * Verify and retrieve payload from a given token
     */
    async #getJkuVerifiedTokenPayload<T extends z.ZodTypeAny>(token: string, payloadSchema: T): Promise<z.infer<T>> {
        const decodedToken = JWT.decode(token, { complete: true });

        if (!decodedToken) {
            // TODO: Decoded token is null
            return;
        }

        const { jku, kid } = decodedToken.header;

        // TODO: Convert to schema check?
        if (typeof jku !== "string") {
            throw new DigiMeSdkTypeError("Invalid JKU");
        }

        if (typeof kid !== "string") {
            throw new DigiMeSdkTypeError("Invalid KID");
        }

        const jkuResponse = await DigiMeSDK.#fetch(jku, {
            headers: {
                Accept: "application/json",
            },
        });

        const jwks = JWKS.parse(await jkuResponse.json());

        const matchingKey = jwks.keys.find((key) => key.kid === kid);

        if (!matchingKey) {
            // TODO: Better error text?
            throw new DigiMeSdkTypeError("DigiMeSDK - JKU returned a JWKS with a no matching keys");
        }

        return payloadSchema.parse(JWT.verify(token, matchingKey.pem, { algorithms: ["PS512"] }));
    }

    /**
     * Retrieve available services from the Digi.me Discovery API
     *
     * By default, it will return ALL the onboardable services
     *
     * However, if you pass in the `contractId` parameter, Digi.me Discovery API will instead
     * return only the services that can be onboarded with the provided contract
     */
    public async getAvailableServices({
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

        const response = await DigiMeSDK.#fetch(new URL("discovery/services", this.#config.baseURL), {
            headers,
            signal,
        });

        return DiscoveryAPIServicesResponse.parse(await response.json()).data;
    }

    /**
     * TODO: Write this docs
     */
    public async getAuthorizeUrl(parameters: GetAuthorizeUrlParameters): Promise<GetAuthorizeUrlReturn> {
        if (!this.#contractDetails) {
            throw new DigiMeSdkTypeError(errorMessages.noContractDetailsProvided);
        }

        const {
            callback,
            state,
            sessionOptions,
            serviceId,
            sourceType = "pull",
        } = GetAuthorizeUrlParameters.parse(parameters);
        const codeVerifier = toBase64Url(getRandomAlphaNumeric(32));
        const token = this.#signTokenPayload({
            /**
             * NOTE: Seemingly oauth/authorize can be used in various ways
             *  - No token pair -> authorize a contract
             *  - Valid token pair -> authorize a contract
             *  - Invalid token pair -> (re)authorize a contract
             *
             * This is why we don't call `this.#validTokenPairOrThrow here
             */
            /**
             * TODO: VERIFY THE ABOVE CLAIM!
             */
            access_token: this.#tokenPair?.access_token.value,
            client_id: `${this.#config.applicationId}_${this.#contractDetails.contractId}`,
            code_challenge: toBase64Url(getSha256Hash(codeVerifier)),
            code_challenge_method: "S256",
            nonce: getRandomAlphaNumeric(32),
            redirect_uri: callback,
            response_mode: "query",
            response_type: "code",
            state,
            timestamp: Date.now(),
        });

        try {
            const response = await DigiMeSDK.#fetch(new URL("oauth/authorize", this.#config.baseURL), {
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
            const responseData = OauthAuthorizeResponse.parse(await response.json());
            const tokenPayload = await this.#getJkuVerifiedTokenPayload(
                responseData.token,
                PayloadPreauthorizationCode,
            );

            // Set up onboard URL
            const onboardUrl = new URL(`authorize`, this.#config.onboardURL);
            onboardUrl.searchParams.set("code", tokenPayload.preauthorization_code);
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

    getOnboardServiceUrl() {
        console.log("===getOnboardServiceUrl");
        return "boop";
    }

    getReauthorizeAccountUrl() {}

    async exchangeCodeForToken(codeVerifier: string, authorizationCode: string) {
        // TODO: Better parameters
        // TODO: Validate parameters

        if (!this.#contractDetails) {
            throw new DigiMeSdkTypeError(errorMessages.noContractDetailsProvided);
        }

        const token = this.#signTokenPayload({
            client_id: `${this.#config.applicationId}_${this.#contractDetails.contractId}`,
            code: authorizationCode,
            code_verifier: codeVerifier,
            grant_type: "authorization_code",
            nonce: getRandomAlphaNumeric(32),
            timestamp: Date.now(),
        });

        // eslint-disable-next-line no-useless-catch
        try {
            const response = await DigiMeSDK.#fetch(new URL("oauth/token", this.#config.baseURL), {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            const responseData = OauthTokenResponse.parse(await response.json());
            return await this.#getJkuVerifiedTokenPayload(responseData.token, TokenPair);
        } catch (error) {
            // TODO: Do something useful here
            throw error;
        }
    }

    pushData() {}

    readSession() {}

    deleteUser() {}

    readFile() {}

    readFileList() {}

    readAllFiles() {}

    readAccounts() {}
}
