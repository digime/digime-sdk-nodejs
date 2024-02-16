/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { DiscoveryApiServicesResponse } from "../schemas/api/discovery/response";
import { fromBase64Url, getRandomAlphaNumeric, getSha256Hash, toBase64Url } from "../crypto";
import SDK_VERSION from "../sdk-version";
import { OauthAuthorizeResponse } from "../schemas/api/oauth/authorize-response";
import { PayloadPreauthorizationCode } from "../schemas/api/jwt-payloads";
import { OauthTokenResponse } from "../schemas/api/oauth/tokens";
import { parseWithSchema } from "../zod/zod-parse";
import { fetchWrapper } from "../fetch/fetch";
import { signTokenPayload } from "../sign-token-payload";
import { getVerifiedTokenPayload } from "../get-verified-token-payload";
import { TrustedJwks } from "../trusted-jwks";
import { UserAuthorization } from "../user-authorization";
import { DigiMeSdkError, DigiMeSdkTypeError } from "../errors/errors";
import { errorMessages } from "../errors/messages";
import { z } from "zod";
import { DEFAULT_BASE_URL, DEFAULT_ONBOARD_URL } from "../constants";
import { nodeReadableFromWeb } from "../node-streams";
import { DigiMeSessionFile } from "./digi-me-session-file";
import { SessionFileHeaderMetadata } from "../schemas/api/session/session-file-header-metadata";
import { SessionFileList } from "../schemas/api/session/session-file-list";
import { UserAccounts } from "../schemas/api/user-account";
import { SampleDataSets } from "../schemas/api/sample-datasets/sample-data-sets";
import type { GetAuthorizeUrlOptionsInput, GetAuthorizeUrlReturn } from "../schemas/digi-me-sdk";
import {
    ExchangeCodeForUserAuthorizationOptions,
    GetAuthorizeUrlOptions,
    GetAvailableServicesOptions,
    GetSampleDataSetsForSourceOptions,
} from "../schemas/digi-me-sdk";
import type {
    DeleteUserOptionsInput,
    ReadAccountsOptionsInput,
    ReadSessionOptionsInput,
} from "../schemas/digi-me-sdk-authorized";
import {
    ReadAccountsOptions,
    DeleteUserOptions,
    GetPortabilityReportOptions,
    GetPortabilityReportAs,
    ReadSessionOptions,
    ReadFileListOptions,
    ReadFileOptions,
    PushDataOptions,
} from "../schemas/digi-me-sdk-authorized";
import type { Readable } from "node:stream";
import { SessionTriggerResponse } from "../schemas/api/session/session-trigger";

// Transform and casting to have a more specific type for typechecking
const UrlWithTrailingSlash = z
    .string()
    .url()
    .endsWith("/")
    .transform((value) => value as `${string}/`);

/**
 * Configuration options for Digi.me SDK
 */
export const DigiMeSdkConfig = z.object(
    {
        /** Your customised application ID from digi.me */
        applicationId: z.string(),

        /** The ID of the contract you intend to use */
        contractId: z.string(),

        /** Private key in PKCS1 format of the contract you intend to use */
        contractPrivateKey: z.string(),

        /**
         * Root URL for the digi.me API
         * Must end with a trailing slash
         * @defaultValue `"https://api.digi.me/v1.7/"`
         */
        baseUrl: UrlWithTrailingSlash.default(DEFAULT_BASE_URL),

        /**
         * Root URL for the digi.me web onboard
         * Must end with a trailing slash
         * @defaultValue `"https://api.digi.me/apps/saas/"`
         */
        onboardUrl: UrlWithTrailingSlash.default(DEFAULT_ONBOARD_URL),
    },
    {
        required_error: "SdkConfig is required",
        invalid_type_error: "SdkConfig must be an object",
    },
);

export type DigiMeSdkConfig = z.infer<typeof DigiMeSdkConfig>;

/**
 * Input configuration options for Digi.me SDK
 */
export type InputDigiMeSdkConfig = z.input<typeof DigiMeSdkConfig>;

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
    get applicationId(): DigiMeSdkConfig["applicationId"] {
        return this.#config.applicationId;
    }

    /**
     * The `contractId` this instance has been instantiated with
     */
    get contractId(): DigiMeSdkConfig["contractId"] {
        return this.#config.contractId;
    }

    /**
     * The `contractPrivateKey` this instance has been instantiated with
     */
    get contractPrivateKey(): DigiMeSdkConfig["contractPrivateKey"] {
        return this.#config.contractPrivateKey;
    }

    /**
     * The `baseUrl` this instance has been instantiated with
     */
    get baseUrl(): DigiMeSdkConfig["baseUrl"] {
        return this.#config.baseUrl;
    }

    /**
     * The `onboardUrl` this instance has been instantiated with
     */
    get onboardUrl(): DigiMeSdkConfig["onboardUrl"] {
        return this.#config.onboardUrl;
    }

    /**
     * Get an instance of the `DigiMeSdkAuthorized` that can call methods that require `UserAuthorization`
     */
    withUserAuthorization(
        userAuthorization: ConstructorParameters<typeof DigiMeSdkAuthorized>[0]["userAuthorization"],
        onUserAuthorizationUpdated: ConstructorParameters<typeof DigiMeSdkAuthorized>[0]["onUserAuthorizationUpdated"],
    ): DigiMeSdkAuthorized {
        return new DigiMeSdkAuthorized({
            digiMeSdkInstance: this,
            userAuthorization,
            onUserAuthorizationUpdated,
        });
    }

    /**
     * Retrieve available services from the Digi.me Discovery API
     *
     * By default, it will return ALL the onboardable services
     *
     * However, if you pass in the `contractId` parameter, Digi.me Discovery API will instead
     * return only the services that can be onboarded with the provided contract
     *
     * TODO: Rename this to actually match what it is, it's not services, it's sources and it's also other stuff
     */
    async getAvailableServices(options?: GetAvailableServicesOptions): Promise<DiscoveryApiServicesResponse["data"]> {
        const { contractId, signal } = parseWithSchema(
            options,
            GetAvailableServicesOptions,
            "`getAvailableServices` options",
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

        return parseWithSchema(await response.json(), DiscoveryApiServicesResponse).data;
    }

    /**
     * TODO: Explain better. Rename? Reimplement better?
     *
     * Returns an object with the following:
     * - `url` - A URL you should redirect to for user authorization an onboarding
     * - `codeVerifier` - You should keep, as it will be needed later to exchange for `UserAuthorization`
     * - `session` - You should keep, as it will be needed later to access the data user has authorized access to
     */
    async getAuthorizeUrl(options: GetAuthorizeUrlOptionsInput): Promise<GetAuthorizeUrlReturn> {
        const {
            callback,
            state,
            sessionOptions,
            serviceId,
            sourceType,
            preferredLocale,
            includeSampleDataOnlySources,
            userAuthorization,
            signal,
        } = parseWithSchema(options, GetAuthorizeUrlOptions, "`getAuthorizeUrl` options");

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

        if (userAuthorization) {
            tokenPayload.access_token = userAuthorization.asPayload().access_token.value;
        }

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
        options: ExchangeCodeForUserAuthorizationOptions,
    ): Promise<UserAuthorization> {
        const { codeVerifier, authorizationCode, signal } = parseWithSchema(
            options,
            ExchangeCodeForUserAuthorizationOptions,
            "`exchangeCodeForUserAuthorization` options",
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
    async refreshUserAuthorization(userAuthorization: UserAuthorization): Promise<UserAuthorization> {
        userAuthorization = parseWithSchema(
            userAuthorization,
            z.instanceof(UserAuthorization),
            "`userAuthorization` argument",
        );

        if (!userAuthorization.isRefreshable()) {
            throw new DigiMeSdkError(errorMessages.accessAndRefreshTokenExpired);
        }

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

    /**
     * Retrieve available sample datasets for a given source
     */
    async getSampleDataSetsForSource(options: GetSampleDataSetsForSourceOptions): Promise<SampleDataSets> {
        const { sourceId, signal } = parseWithSchema(
            options,
            GetSampleDataSetsForSourceOptions,
            "`getSampleDataSetsForSource` options",
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

/**
 * Configuration options for Authorized Digi.me SDK
 */
export const DigiMeSdkAuthorizedConfig = z.object(
    {
        /** Instance of DigiMeSdk to bind this DigiMeSdkAuthorized instance to */
        digiMeSdkInstance: z.instanceof(DigiMeSdk),

        /**  Instance of the `UserAuthorization` to bind this DigiMeSdkAuthorized instance to */
        userAuthorization: z.instanceof(UserAuthorization),

        /**
         * Callback that will provide new UserAuthorization if the ones provided are automatically updated by
         * the SDK.
         */
        onUserAuthorizationUpdated: z
            .function()
            .args(
                z.object({
                    oldUserAuthorization: z.instanceof(UserAuthorization),
                    newUserAuthorization: z.instanceof(UserAuthorization),
                }),
            )
            .returns(z.void()),
    },
    {
        required_error: "DigiMeSdkAuthorized config is required",
        invalid_type_error: "DigiMeSdkAuthorized config must be an object",
    },
);

export type DigiMeSdkAuthorizedConfig = z.infer<typeof DigiMeSdkAuthorizedConfig>;

export class DigiMeSdkAuthorized {
    #config: DigiMeSdkAuthorizedConfig;

    constructor(config: DigiMeSdkAuthorizedConfig) {
        this.#config = parseWithSchema(
            config,
            DigiMeSdkAuthorizedConfig,
            'DigiMeSdkAuthorized constructor parameter "config"',
        );
    }

    /**
     * Attempt to refresh the instance of UserAuthorization attached to this instance and recieve a new one in return
     *
     * **NOTE**: This will also trigger this instances `onUserAuthorizationUpdated` callback, if one was provided!
     */
    async refreshUserAuthorization(): Promise<UserAuthorization> {
        const newUserAuthorization = await this.#config.digiMeSdkInstance.refreshUserAuthorization(
            this.#config.userAuthorization,
        );

        // Call the update hook
        if (this.#config.onUserAuthorizationUpdated) {
            this.#config.onUserAuthorizationUpdated({
                oldUserAuthorization: this.#config.userAuthorization,
                newUserAuthorization,
            });
        }

        this.#config.userAuthorization = newUserAuthorization;

        return newUserAuthorization;
    }

    async #getCurrentUserAuthorizationOrThrow() {
        if (this.#config.userAuthorization.isUsable()) {
            return this.#config.userAuthorization;
        }

        return await this.refreshUserAuthorization();
    }

    /**
     * Retrieve source accounts tied to the library
     */
    async readAccounts(options?: ReadAccountsOptionsInput): Promise<UserAccounts> {
        const { signal } = parseWithSchema(options, ReadAccountsOptions, "`readAcccounts` options");
        const userAuthorization = await this.#getCurrentUserAuthorizationOrThrow();
        const token = await signTokenPayload(
            {
                access_token: userAuthorization.asPayload().access_token.value,
                client_id: `${this.#config.digiMeSdkInstance.applicationId}_${this.#config.digiMeSdkInstance.contractId}`,
                nonce: getRandomAlphaNumeric(32),
                timestamp: Date.now(),
            },
            this.#config.digiMeSdkInstance.contractPrivateKey,
        );

        const response = await fetchWrapper(
            new URL("permission-access/accounts", this.#config.digiMeSdkInstance.baseUrl),
            {
                signal,
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            },
        );

        return parseWithSchema(await response.json(), UserAccounts);
    }

    async readSession(options?: ReadSessionOptionsInput): Promise<SessionTriggerResponse["session"]> {
        const { signal, ...sessionTriggerConfiguration } = parseWithSchema(
            options,
            ReadSessionOptions,
            "`readSession` options",
        );
        const userAuthorization = await this.#getCurrentUserAuthorizationOrThrow();
        const token = await signTokenPayload(
            {
                access_token: userAuthorization.asPayload().access_token.value,
                client_id: `${this.#config.digiMeSdkInstance.applicationId}_${this.#config.digiMeSdkInstance.contractId}`,
                nonce: getRandomAlphaNumeric(32),
                timestamp: Date.now(),
            },
            this.#config.digiMeSdkInstance.contractPrivateKey,
        );

        const response = await fetchWrapper(
            new URL("permission-access/trigger", this.#config.digiMeSdkInstance.baseUrl),
            {
                method: "POST",
                signal,
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...sessionTriggerConfiguration,
                    agent: {
                        sdk: {
                            name: "nodejs",
                            version: SDK_VERSION,
                            meta: {
                                node: process.version,
                            },
                        },
                    },
                }),
            },
        );

        return parseWithSchema(await response.json(), SessionTriggerResponse).session;
    }

    async getOnboardServiceUrl() {}

    async getReauthorizeAccountUrl() {}

    /**
     * Attempts to delete the user that this instances UserAuthorization is bound to
     */
    async deleteUser(options?: DeleteUserOptionsInput): Promise<void> {
        const { signal } = parseWithSchema(options, DeleteUserOptions, "`deleteUser` options");
        const userAuthorization = await this.#getCurrentUserAuthorizationOrThrow();
        const token = await signTokenPayload(
            {
                access_token: userAuthorization.asPayload().access_token.value,
                client_id: `${this.#config.digiMeSdkInstance.applicationId}_${this.#config.digiMeSdkInstance.contractId}`,
                nonce: getRandomAlphaNumeric(32),
                timestamp: Date.now(),
            },
            this.#config.digiMeSdkInstance.contractPrivateKey,
        );

        await fetchWrapper(new URL("user", this.#config.digiMeSdkInstance.baseUrl), {
            method: "DELETE",
            signal,
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
        });
    }

    /**
     * Retrieve the portability report
     */
    async getPortabilityReport(as: "string", options: GetPortabilityReportOptions): Promise<string>;
    async getPortabilityReport(
        as: "ReadableStream",
        options: GetPortabilityReportOptions,
    ): Promise<NonNullable<Response["body"]>>;
    async getPortabilityReport(as: "NodeReadable", options: GetPortabilityReportOptions): Promise<Readable>;
    async getPortabilityReport(
        as: GetPortabilityReportAs,
        options: GetPortabilityReportOptions,
    ): Promise<string | Readable | NonNullable<Response["body"]>> {
        as = parseWithSchema(as, GetPortabilityReportAs, "`getPortabilityReport` `as` argument");
        const { serviceType, format, from, to, signal } = parseWithSchema(
            options,
            GetPortabilityReportOptions,
            "`getPortabilityReport` `options` argument",
        );

        const userAuthorization = await this.#getCurrentUserAuthorizationOrThrow();
        const token = await signTokenPayload(
            {
                access_token: userAuthorization.asPayload().access_token.value,
                client_id: `${this.#config.digiMeSdkInstance.applicationId}_${this.#config.digiMeSdkInstance.contractId}`,
                nonce: getRandomAlphaNumeric(32),
                timestamp: Date.now(),
            },
            this.#config.digiMeSdkInstance.contractPrivateKey,
        );

        const url = new URL(`export/${serviceType}/report`, this.#config.digiMeSdkInstance.baseUrl);
        url.searchParams.set("format", format);
        if (from) url.searchParams.set("from", from.toString());
        if (to) url.searchParams.set("to", to.toString());

        const response = await fetchWrapper(url, {
            signal,
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/octet-stream",
            },
        });

        if (as === "string") {
            return await response.text();
        }

        // NOTE: Maybe return an empty readable if this turns out to be problematic
        if (!response.body) {
            throw new DigiMeSdkTypeError("Response contains no body");
        }

        if (as === "NodeReadable") {
            return nodeReadableFromWeb(response.body);
        }

        return response.body;
    }

    async pushData(options: PushDataOptions): Promise<void> {
        options = parseWithSchema(options, PushDataOptions, "`pushData` options");

        // switch (options.type) {
        //     case "library":
        //         return;
        //     case "provider":
        //         return;
        //     default:
        //         return assertUnreachableCase(options);
        // }

        if (options.type === "library") {
            // LIBRARY PUSH
            const userAuthorization = await this.#getCurrentUserAuthorizationOrThrow();

            const token = await signTokenPayload(
                {
                    access_token: userAuthorization.asPayload().access_token.value,
                    client_id: `${this.#config.digiMeSdkInstance.applicationId}_${this.#config.digiMeSdkInstance.contractId}`,
                    nonce: getRandomAlphaNumeric(32),
                    timestamp: Date.now(),
                },
                this.#config.digiMeSdkInstance.contractPrivateKey,
            );

            const fileDescriptor = await signTokenPayload(
                // TODO: Move this around?
                { metadata: options.fileDescriptor },
                this.#config.digiMeSdkInstance.contractPrivateKey,
            );

            await fetchWrapper(new URL("permission-access/import", this.#config.digiMeSdkInstance.baseUrl), {
                method: "POST",
                // @ts-expect-error Undici requires duplex option
                duplex: "half",
                signal: options.signal,
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/octet-stream",
                    FileDescriptor: fileDescriptor,
                },
                body: options.data,
            });

            return;
        }

        throw new Error("TODO: Provider NYI");
    }

    async readFileList(options: ReadFileListOptions): Promise<SessionFileList> {
        const { sessionKey, signal } = parseWithSchema(options, ReadFileListOptions, "`readFileList` options");

        const userAuthorization = await this.#getCurrentUserAuthorizationOrThrow();
        const token = await signTokenPayload(
            {
                access_token: userAuthorization.asPayload().access_token.value,
                client_id: `${this.#config.digiMeSdkInstance.applicationId}_${this.#config.digiMeSdkInstance.contractId}`,
                nonce: getRandomAlphaNumeric(32),
                timestamp: Date.now(),
            },
            this.#config.digiMeSdkInstance.contractPrivateKey,
        );

        const response = await fetchWrapper(
            new URL(`permission-access/query/${sessionKey}`, this.#config.digiMeSdkInstance.baseUrl),
            {
                signal,
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            },
        );

        return parseWithSchema(await response.json(), SessionFileList);
    }

    async readFile(options: ReadFileOptions): Promise<DigiMeSessionFile> {
        const { sessionKey, fileName, signal } = parseWithSchema(options, ReadFileOptions, "`readFile` options");

        const userAuthorization = await this.#getCurrentUserAuthorizationOrThrow();
        const token = await signTokenPayload(
            {
                access_token: userAuthorization.asPayload().access_token.value,
                client_id: `${this.#config.digiMeSdkInstance.applicationId}_${this.#config.digiMeSdkInstance.contractId}`,
                nonce: getRandomAlphaNumeric(32),
                timestamp: Date.now(),
            },
            this.#config.digiMeSdkInstance.contractPrivateKey,
        );

        const response = await fetchWrapper(
            new URL(`permission-access/query/${sessionKey}/${fileName}`, this.#config.digiMeSdkInstance.baseUrl),
            {
                signal,
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/octet-stream",
                },
            },
        );

        if (!response.body) {
            throw new DigiMeSdkTypeError("Response contains no body");
        }

        let metadataHeader = response.headers.get("x-metadata");

        if (!metadataHeader) {
            await response.body.cancel();
            throw new DigiMeSdkTypeError("Missing `x-metadata` header from Digi.me API response");
        }

        try {
            metadataHeader = JSON.parse(fromBase64Url(metadataHeader));
        } catch (error) {
            await response.body.cancel();
            throw new DigiMeSdkTypeError("Unable to convert `x-metadata` header to object", { cause: error });
        }

        const { metadata, compression } = parseWithSchema(
            metadataHeader,
            SessionFileHeaderMetadata,
            "`readFile` `x-metadata` header",
        );

        return new DigiMeSessionFile({
            input: response.body,
            privateKey: this.#config.digiMeSdkInstance.contractPrivateKey,
            fileName,
            metadata: metadata,
            compression: compression,
        });
    }

    async readAllFiles() {}
}
