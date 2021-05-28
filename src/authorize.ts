/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import { URL, URLSearchParams } from "url";
import { authorize } from "./authorisation";
import { TypeValidationError } from "./errors";
import { CAScope, InternalProps } from "./sdk";
import { Session } from "./types/api/session";
import { UserAccessToken, UserAccessTokenCodec } from "./types/user-access-token";
import * as t from "io-ts";

interface GetAuthorizeUrlProps {
    errorCallback: string;
    serviceId?: number;
    userAccessToken?: UserAccessToken;
    scope?: CAScope;
    state?: string
}

export const GetAuthorizeUrlPropsCodec: t.Type<GetAuthorizeUrlProps> = t.intersection([
    t.type({
        errorCallback: t.string,
    }),
    t.partial({
        serviceId: t.number,
        userAccessToken: UserAccessTokenCodec,
        state: t.string
    })
]);


export interface GetAuthorizationUrlResponse {
    url: string;
    codeVerifier: string;
    session: Session;
}

const getAuthorizeUrl = async ({
    sdkConfig,
    ...props
}: GetAuthorizeUrlProps & InternalProps): Promise<GetAuthorizationUrlResponse> => {

    if (!GetAuthorizeUrlPropsCodec.is(props)) {
        // tslint:disable-next-line:max-line-length
        throw new TypeValidationError("Details should be a plain object that contains the properties applicationId, contractId, privateKey and redirectUri");
    }

    const { code, codeVerifier, session } = await authorize({
        ...props,
        sdkConfig,
    });

    const result: URL = new URL("/authorize", `${sdkConfig.onboardUrl}`);
    result.search = new URLSearchParams({
        code,
        errorCallback: props.errorCallback,
        successCallback: sdkConfig.authConfig.redirectUri,
        serviceId: props.serviceId?.toString(),
    }).toString();

    return {
        url: result.toString(),
        codeVerifier,
        session,
    };
};

export {
    getAuthorizeUrl,
    GetAuthorizeUrlProps
};
