/*!
 * Copyright (c) 2009-2020 digi.me Limited. All rights reserved.
 */

import { URL, URLSearchParams } from "url";
import { TypeValidationError } from "./errors";
import { Session } from "./sdk";
import sdkVersion from "./sdk-version";
import { isValidString } from "./utils";
import { assertIsSession } from "./types/api/session";

const getAuthorizeUrl = (
    appId: string,
    session: Session,
    callbackUrl?: string,
): string => {

    if (!isValidString(callbackUrl)) {
        throw new TypeValidationError("Parameter callbackUrl should be a non empty string");
    }

    return getClientPrivateShareDeepLink(appId, session, new URLSearchParams({ callbackUrl }));
};

const getClientPrivateShareDeepLink = (
    appId: string,
    session: Session,
    options: URLSearchParams,
) => {

    assertIsSession(session);

    if (!isValidString(appId)) {
        throw new TypeValidationError("Parameter appId should be a non empty string");
    }

    const query: URLSearchParams = options || new URLSearchParams();
    query.append("sessionKey", session.sessionKey);
    query.append("appId", appId);
    query.append("sdkVersion", sdkVersion);
    query.append("resultVersion", "2");

    const result: URL = new URL(`digime://consent-access`);
    result.search = query.toString();
    return result.toString();
};

export {
    getAuthorizeUrl,
    getClientPrivateShareDeepLink,
};
