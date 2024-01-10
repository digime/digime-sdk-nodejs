/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { DigiMeSdkError } from "./errors/errors";
import { getVerifiedTokenPayload } from "./get-verified-token-payload";
import {
    LegacyUserAuthorizationPayload,
    UserAuthorizationPayload,
    fromLegacyUserAuthorizationPayload,
    toLegacyUserAuthorizationPayload,
} from "./types/external/oauth-token";
import { parseWithSchema } from "./zod/zod-parse";

const CONSTRUCTOR_TOKEN = Symbol();

type UserAuthorizationConstructorOptions = {
    payload: UserAuthorizationPayload;
    jwt?: string;
};

export class UserAuthorization {
    #payload: UserAuthorizationPayload;
    #jwt: string | undefined;

    constructor(constructorToken: typeof CONSTRUCTOR_TOKEN, options: UserAuthorizationConstructorOptions) {
        if (constructorToken !== CONSTRUCTOR_TOKEN) {
            throw new DigiMeSdkError(
                "`UserAuthorization` should not be instantiated manually. Instead, use one of these static methods to get an instance:\n - UserAuthorization.fromJwt()\n - UserAuthorization.fromPayload()\n - UserAuthorization.fromJsonPayload()\n",
            );
        }

        this.#payload = options.payload;
        this.#jwt = options.jwt;
    }

    static async fromJwt(jwt: string): Promise<UserAuthorization> {
        const payload = await getVerifiedTokenPayload(jwt, UserAuthorizationPayload);
        return new UserAuthorization(CONSTRUCTOR_TOKEN, { jwt, payload });
    }

    static fromPayload(value: Record<string, unknown>) {
        const payload = parseWithSchema(value, UserAuthorizationPayload);
        return new UserAuthorization(CONSTRUCTOR_TOKEN, { payload });
    }

    static fromJsonPayload(value: string): UserAuthorization {
        const payload = parseWithSchema(JSON.parse(value), UserAuthorizationPayload);
        return new UserAuthorization(CONSTRUCTOR_TOKEN, { payload });
    }

    static fromLegacyPayload(value: Record<string, unknown>) {
        const legacyPayload = parseWithSchema(value, LegacyUserAuthorizationPayload);
        return new UserAuthorization(CONSTRUCTOR_TOKEN, {
            payload: fromLegacyUserAuthorizationPayload(legacyPayload),
        });
    }

    static fromLegacyJsonPayload(value: string) {
        const legacyPayload = parseWithSchema(JSON.parse(value), LegacyUserAuthorizationPayload);
        return new UserAuthorization(CONSTRUCTOR_TOKEN, {
            payload: fromLegacyUserAuthorizationPayload(legacyPayload),
        });
    }

    asJwt(): string {
        if (!this.#jwt) {
            // Make self-signed or unsigned token?
            throw new DigiMeSdkError("TODO");
        }

        return this.#jwt;
    }

    asPayload(): UserAuthorizationPayload {
        return this.#payload;
    }

    asJsonPayload(): string {
        return JSON.stringify(this.#payload);
    }

    asLegacyPayload(): LegacyUserAuthorizationPayload {
        return toLegacyUserAuthorizationPayload(this.#payload);
    }

    asLegacyJsonPayload(): string {
        return JSON.stringify(toLegacyUserAuthorizationPayload(this.#payload));
    }
}
