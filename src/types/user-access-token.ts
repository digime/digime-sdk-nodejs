/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import * as t from "io-ts";

interface Token {
    expiry: number;
    value: string;
}

interface UserAccessToken {
    accessToken: Token;
    refreshToken: Token;
}

const TokenCodec: t.Type<Token> = t.type({
    expiry: t.number,
    value: t.string,
});

const UserAccessTokenCodec: t.Type<UserAccessToken> = t.type({
    accessToken: TokenCodec,
    refreshToken: TokenCodec,
});

export {
    UserAccessToken,
    UserAccessTokenCodec,
}
