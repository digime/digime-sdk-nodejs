/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { z } from "zod";
import { DigiMeSdkError } from "./errors/errors";
import { getVerifiedTokenPayload } from "./get-verified-token-payload";
import {
    LegacyUserAuthorizationPayload,
    UserAuthorizationPayload,
    fromLegacyUserAuthorizationPayload,
    toLegacyUserAuthorizationPayload,
} from "./schemas/api/oauth/tokens";
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

    /**
     * Checks if the UserAuthorization can be used.
     * Based on a timestamp and tolerance
     */
    isUsable(
        /**
         * Tolerance for usage expiry in miliseconds. Token needs to expire in less than tolerance from now to be valid.
         * @defaultValue `10000`
         */
        tolerance: number = 10000,

        /**
         * Timestamp in milliseconds, which determines what is considered "now", from which to calculate usability.
         * @defaultValue `Date.now()`
         */
        now: number = Date.now(),
    ): boolean {
        tolerance = parseWithSchema(tolerance, z.number().nonnegative(), "`tolerance` argument");
        now = parseWithSchema(now, z.number().nonnegative(), "`now` argument");
        return this.#payload.access_token.expires_on * 1000 - tolerance > now;
    }

    /**
     * Checks if the UserAuthorization can be refreshed.
     * Based on a timestamp and tolerance
     */
    isRefreshable(
        /**
         * Tolerance for refresh expiry in seconds. Token needs to expire in less than tolerance from now to be valid.
         * @defaultValue `10000`
         */
        tolerance: number = 10000,

        /**
         * Timestamp in milliseconds, which determines what is considered "now", from which to calculate usability.
         * @defaultValue `Date.now()`
         */
        now: number = Date.now(),
    ): boolean {
        tolerance = parseWithSchema(tolerance, z.number().nonnegative(), "`tolerance` argument");
        now = parseWithSchema(now, z.number().nonnegative(), "`now` argument");
        return this.#payload.refresh_token.expires_on * 1000 - tolerance > now;
    }
}
