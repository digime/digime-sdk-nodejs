/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { DigiMeSdkError } from "./errors/errors";
import { getTokenPayload } from "./get-token-payload";
import {
    LegacyOauthTokenPayload,
    OauthTokenPayload,
    fromLegacyOauthTokenPayload,
    toLegacyOauthTokenPayload,
} from "./types/external/oauth-token";
import { parseWithSchema } from "./zod/zod-parse";

const CONSTRUCTOR_TOKEN = Symbol();

type AuthorizationCredentialsConstructorOptions = {
    payload: OauthTokenPayload;
    jwt?: string;
};

export class AuthorizationCredentials {
    #payload: OauthTokenPayload;
    #jwt: string | undefined;

    constructor(constructorToken: typeof CONSTRUCTOR_TOKEN, options: AuthorizationCredentialsConstructorOptions) {
        if (constructorToken !== CONSTRUCTOR_TOKEN) {
            throw new DigiMeSdkError(
                "`AuthorizationCredentials` class should not me instantiated manually. Instead, use one of these static methods to get an instance:\n - AuthorizationCredentials.fromJwt()\n - AuthorizationCredentials.fromPayload()\n - AuthorizationCredentials.fromJsonPayload()\n",
            );
        }

        this.#payload = options.payload;
        this.#jwt = options.jwt;
    }

    static async fromJwt(jwt: string): Promise<AuthorizationCredentials> {
        const payload = await getTokenPayload(jwt, OauthTokenPayload);
        return new AuthorizationCredentials(CONSTRUCTOR_TOKEN, { jwt, payload });
    }

    static fromPayload(value: Record<string, unknown>) {
        const payload = parseWithSchema(value, OauthTokenPayload);
        return new AuthorizationCredentials(CONSTRUCTOR_TOKEN, { payload });
    }

    static fromJsonPayload(value: string): AuthorizationCredentials {
        const payload = parseWithSchema(JSON.parse(value), OauthTokenPayload);
        return new AuthorizationCredentials(CONSTRUCTOR_TOKEN, { payload });
    }

    static fromLegacyPayload(value: Record<string, unknown>) {
        const legacyPayload = parseWithSchema(value, LegacyOauthTokenPayload);
        return new AuthorizationCredentials(CONSTRUCTOR_TOKEN, {
            payload: fromLegacyOauthTokenPayload(legacyPayload),
        });
    }

    static fromLegacyJsonPayload(value: string) {
        const legacyPayload = parseWithSchema(JSON.parse(value), LegacyOauthTokenPayload);
        return new AuthorizationCredentials(CONSTRUCTOR_TOKEN, {
            payload: fromLegacyOauthTokenPayload(legacyPayload),
        });
    }

    asJwt(): string {
        if (!this.#jwt) {
            // Make self-signed or unsigned token?
            throw new Error("TODO");
        }

        return this.#jwt;
    }

    asPayload(): OauthTokenPayload {
        return this.#payload;
    }

    asJsonPayload(): string {
        return JSON.stringify(this.#payload);
    }

    asLegacyPayload(): LegacyOauthTokenPayload {
        return toLegacyOauthTokenPayload(this.#payload);
    }

    asLegacyJsonPayload(): string {
        return JSON.stringify(toLegacyOauthTokenPayload(this.#payload));
    }
}
