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
import { Network } from "./network";

/**
 * Digi.me SDK
 */
export class DigiMeSDK {
    #config: Required<SdkConfig>;
    #network: Network;

    constructor(config: SdkConfig) {
        const parsedConfig = SdkConfig.parse(config);

        // TODO: Enforce trailing slash on setting baseURL
        this.#config = {
            baseURL: "https://api.digi.me/v1.7/",
            onboardURL: "https://api.digi.me/apps/saas/",
            onTokenRefreshed: () => {},
            ...parsedConfig,
        };

        this.#network = new Network();
    }

    /**
     * Verify and retrieve payload from a given token
     */
    async #getTokenPayload(token: string) {
        const decodedToken = JWT.decode(token, { complete: true });

        if (!decodedToken) {
            // TODO: Decoded token is null
            return;
        }

        const { jku, kid } = decodedToken.header;

        if (typeof jku !== "string") {
            // TODO: Errors
            throw new TypeError("Invalid JKU");
        }

        if (typeof kid !== "string") {
            // TODO: Errors
            throw new TypeError("Invalid KID");
        }

        const jkuResponse = await this.#network.fetch(jku, {
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

        return JWT.verify(token, matchingKey.pem, { algorithms: ["PS512"] });
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
    }: {
        contractId?: string;
    } = {}): Promise<DiscoveryAPIServicesData> {
        // TODO: Parse parameters?
        const headers: HeadersInit = {
            Accept: "application/json",
        };

        if (contractId) {
            headers.contractId = contractId;
        }

        // TODO: Retry logic
        const response = await this.#network.fetch(new URL("discovery/services", this.#config.baseURL), { headers });

        if (!response.ok) {
            // TODO: Our own errors
            throw new Error("DigiMeSDK - Discovery API returned a non-ok response");
        }

        return DiscoveryAPIServicesResponse.parse(await response.json()).data;
    }

    /**
     * TODO: Write this
     */
    public async getAuthorizeUrl(parameters: GetAuthorizeUrlParameters): Promise<GetAuthorizeUrlReturn> {
        const { contractDetails, userAccessToken, callback, state, sessionOptions } =
            GetAuthorizeUrlParameters.parse(parameters);

        const codeVerifier = toBase64Url(getRandomAlphaNumeric(32));

        const token = JWT.sign(
            {
                access_token: userAccessToken?.accessToken.value,
                client_id: `${this.#config.applicationId}_${contractDetails.contractId}`,
                code_challenge: toBase64Url(getSha256Hash(codeVerifier)),
                code_challenge_method: "S256",
                nonce: getRandomAlphaNumeric(32),
                redirect_uri: callback,
                response_mode: "query",
                response_type: "code",
                state,
                timestamp: Date.now(),
            },
            contractDetails.privateKey.toString(),
            {
                algorithm: "PS512",
                noTimestamp: true,
            },
        );

        try {
            // TODO: Retry logic
            const response = await this.#network.fetch(new URL("oauth/authorize", this.#config.baseURL), {
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

            const responseData = OauthAuthorizeResponse.parse(await response.json());
            const tokenPayload = PayloadPreauthorizationCode.parse(await this.#getTokenPayload(responseData.token));

            return {
                codeVerifier,
                code: tokenPayload.preauthorization_code,
                session: responseData.session,
            };
        } catch (error) {
            // TODO: Our errors
            // handleServerResponse(error);
            console.log("=== e", error);
            throw error;
        }
    }

    getOnboardServiceUrl() {}

    getReauthorizeAccountUrl() {}

    exchangeCodeForToken() {}

    pushData() {}

    readSession() {}

    deleteUser() {}

    readFile() {}

    readFileList() {}

    readAllFiles() {}

    readAccounts() {}
}
