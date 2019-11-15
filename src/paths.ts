/*!
 * Copyright (c) 2009-2020 digi.me Limited. All rights reserved.
 */

import { URL, URLSearchParams } from "url";
import { ParameterValidationError } from "./errors";
import { Session } from "./sdk";
import sdkVersion from "./sdk-version";
import { isSessionValid, isValidString } from "./utils";

const getAuthorizeUrl = (
    appId: string,
    session: Session,
    callbackUrl?: string,
): string => {

    if (!isValidString(callbackUrl)) {
        throw new ParameterValidationError("Parameter callbackUrl should be a non empty string");
    }

    return getClientPrivateShareDeepLink(appId, session, new URLSearchParams({ callbackUrl }));
};

const getClientPrivateShareDeepLink = (
    appId: string,
    session: Session,
    options: URLSearchParams,
) => {
    if (!isSessionValid(session)) {
        throw new ParameterValidationError(
            // tslint:disable-next-line: max-line-length
            "Session should be an object that contains expiry as number, sessionKey and sessionExchangeToken property as string",
        );
    }
    if (!isValidString(appId)) {
        throw new ParameterValidationError("Parameter appId should be a non empty string");
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
