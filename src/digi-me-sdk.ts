/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import JWT from "jsonwebtoken";
import { SdkConfig } from "./types/digimesdk/sdk-config";
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
import { fetchMachine } from "./machines/fetch-machine";
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

/**
 * Extends [`Response`](https://developer.mozilla.org/docs/Web/API/Response) to
 * make `.json()` method return `Promise<unknown>` instead of `Promise<any>`
 */
interface DigiMeFetchResponse extends Response {
    json(): Promise<unknown>;
}

/**
 * Digi.me SDK
 */
export class DigiMeSDK {
    #config: Required<SdkConfig>;
    #contractDetails?: ContractDetails;
    #tokenPair?: TokenPair;

    constructor(config: SdkConfig) {
        const parsedConfig = SdkConfig.parse(config);

        // TODO: Enforce trailing slash on setting baseURL
        this.#config = {
            baseURL: "https://api.digi.me/v1.7/",
            onboardURL: "https://api.digi.me/apps/saas/",
            onTokenPairRefreshed: () => {},
            ...parsedConfig,
        };
    }

    /**
     * TODO
     */
    setCredentials() {
        const testPrivateKey = new NodeRSA({ b: 2048 });

        this.#contractDetails = {
            contractId: "test-contract-id",
            privateKey: testPrivateKey.exportKey("pkcs1-private-pem").toString(),
        };
        this.#tokenPair = {
            access_token: {
                value: "test-access-token",
                expires_on: "never",
            },
            refresh_token: {
                value: "test-access-token",
                expires_on: "never",
            },
        };
    }

    setContractDetails(details: ContractDetails) {
        this.#contractDetails = details;
    }

    setTokenPair(tokenPair: TokenPair) {
        this.#tokenPair = tokenPair;
    }

    /**
     * Wraps around [`fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/fetch) to provide some automation
     */
    async #fetch(...parameters: ConstructorParameters<typeof Request>): Promise<DigiMeFetchResponse> {
        const fetchActor = interpret(fetchMachine)
            .onTransition((state) => {
                console.log("===", state.value);
            })
            .start();

        fetchActor.send({ type: "FETCH", request: new Request(...parameters) });

        const endState = await waitFor(fetchActor, (state) => Boolean(state.done), { timeout: Infinity });

        // console.log("=== ctx", endState.context);

        // XState types don't expose `data`, so we check for it
        if (!("data" in endState.event)) {
            throw new Error("TODO: No data in endState event, please report this");
        }

        // Return `Response`s
        if (endState.matches("complete") && endState.event.data instanceof Response) {
            return endState.event.data;
        }

        // Throw `Error`s
        if (endState.matches("failed")) {
            // TODO: Our errors
            // throw new AggregateError(endState.context.errors, "Network request failed");
            throw new Error("Network request failed", { cause: endState.context.lastError });
        }

        // TODO: Our errors
        throw new Error("TODO: Unknown end state from state machine, please report this");
    }

    async #refreshTokenPair() {
        if (!this.#contractDetails || !this.#tokenPair) {
            throw new Error("No credentials set, can't refresh token pair");
        }

        const signedToken = this.#signTokenPayload({
            client_id: `${this.#config.applicationId}_${this.#contractDetails.contractId}`,
            grant_type: "refresh_token",
            nonce: getRandomAlphaNumeric(32),
            refresh_token: this.#tokenPair.refresh_token.value,
            timestamp: Date.now(),
        });

        const response = await this.#fetch(new URL("oauth/token", this.#config.baseURL), {
            method: "POST",
            headers: {
                Authorization: `Bearer ${signedToken}`,
                Accept: "application/json",
            },
        });

        const responseData = OauthTokenResponse.parse(await response.json());
        return await this.#getJkuVerifiedTokenPayload(responseData.token, TokenPair);
    }

    /**
     * Signs with default parameters
     * TODO: Write better description
     */
    #signTokenPayload(
        payload: Record<string, unknown>,
        secret: JWT.Secret | undefined = this.#contractDetails?.privateKey,
        options?: JWT.SignOptions,
    ) {
        if (!secret) {
            // TODO: Better error
            throw new Error("No secret");
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
            // TODO: Errors
            throw new TypeError("Invalid JKU");
        }

        if (typeof kid !== "string") {
            // TODO: Errors
            throw new TypeError("Invalid KID");
        }

        const jkuResponse = await this.#fetch(jku, {
            headers: {
                Accept: "application/json",
            },
        });

        if (!jkuResponse.ok) {
            // TODO: Our own errors
            throw new Error("DigiMeSDK - JKU returned a non-ok response");
        }

        const jwks = JWKS.parse(await jkuResponse.json());

        const matchingKey = jwks.keys.find((key) => key.kid === kid);

        if (!matchingKey) {
            throw new Error("DigiMeSDK - JKU returned a JWKS with a no matching keys");
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
        // TODO: Parse parameters?
        const headers: HeadersInit = {
            Accept: "application/json",
        };

        if (contractId) {
            headers.contractId = contractId;
        }

        // TODO: Retry logic
        const response = await this.#fetch(new URL("discovery/services", this.#config.baseURL), {
            headers,
            signal,
        });

        return DiscoveryAPIServicesResponse.parse(await response.json()).data;
    }

    /**
     * TODO: Write this docs
     */
    public async getAuthorizeUrl(parameters: GetAuthorizeUrlParameters): Promise<GetAuthorizeUrlReturn | false> {
        if (!this.#contractDetails) {
            // TODO: Do better
            throw new Error("Credentials not set - ContractDetails");
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
            const response = await this.#fetch(new URL("oauth/authorize", this.#config.baseURL), {
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
            // handleServerResponse(error);
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
            // TODO: Our own errors + better error
            throw new Error("No contract details");
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
            const response = await this.#fetch(new URL("oauth/token", this.#config.baseURL), {
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
            // console.log("caught", error);
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
