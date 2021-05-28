/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import * as t from "io-ts";

export interface UserAccessToken {
    accessToken: string;
    refreshToken: string;
    expiry: number;
}

export const UserAccessTokenCodec: t.Type<UserAccessToken> = t.type({
    accessToken: t.string,
    refreshToken: t.string,
    expiry: t.number,
});


