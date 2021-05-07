/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import { URL, URLSearchParams } from "url";
import { TypeValidationError } from "./errors";
import sdkVersion from "./sdk-version";
import { isNonEmptyString } from "./utils";

enum DigimePaths {
    PRIVATE_SHARE = "digime://consent-access",
    CREATE_POSTBOX = "digime://postbox/create",
}

const getAuthorizeUrl = (
    appId: string,
    callbackUrl?: string,
): string => {

    if (!isNonEmptyString(callbackUrl)) {
        throw new TypeValidationError("Parameter callbackUrl should be a non empty string");
    }

    return getFormattedDeepLink(DigimePaths.PRIVATE_SHARE, appId, new URLSearchParams({ callbackUrl }));
};

const getFormattedDeepLink = (
    path: DigimePaths,
    appId: string,
    options: URLSearchParams,
) => {

    if (!isNonEmptyString(appId)) {
        throw new TypeValidationError("Parameter appId should be a non empty string");
    }

    const query: URLSearchParams = options || new URLSearchParams();
    query.append("appId", appId);
    query.append("sdkVersion", sdkVersion);

    const result: URL = new URL(path);
    result.search = query.toString();
    return result.toString();
};

export {
    getAuthorizeUrl,
    getFormattedDeepLink,
    DigimePaths,
};
