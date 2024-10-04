/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import * as t from "io-ts";

interface Token {
    /**
     * Value in seconds (Unix Epoch Time)
     */
    expiry: number;
    value: string;
}

interface User {
    id?: string;
}

export interface UserAccessToken {
    accessToken: Token;
    refreshToken: Token;
    user?: User;
    consentid?: string;
}

const TokenCodec: t.Type<Token> = t.type({
    expiry: t.number,
    value: t.string,
});

const UserCodec: t.Type<User> = t.partial({
    id: t.string,
});

const UserAccessTokenCodec: t.Type<UserAccessToken> = t.intersection([
    t.type({
        accessToken: TokenCodec,
        refreshToken: TokenCodec,
    }),
    t.partial({
        user: UserCodec,
        consentid: t.string,
    }),
]);

export { UserAccessTokenCodec };
