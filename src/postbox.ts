/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import FormData from "form-data";
import NodeRSA from "node-rsa";
import { encryptData, getRandomAlphaNumeric, getRandomHex } from "./crypto";
import { sign } from "jsonwebtoken";
import { TypeValidationError } from "./errors";
import { net, handleInvalidatedSdkResponse } from "./net";
import { ConsentOnceOptions, ConsentOngoingAccessOptions, GetAuthorizationUrlResponse, PushDataToPostboxOptions, PushDataToPostboxResponse, PushedFileMeta, UserAccessToken } from "./types";
import { areNonEmptyStrings , isNonEmptyString } from "./utils";
import { assertIsSession } from "./types/api/session";
import { getFormattedDeepLink, DigimePaths } from "./paths";
import { URLSearchParams } from "url";
import { assertIsPushDataStatusResponse, PushDataToPostboxAPIResponse } from "./types/api/postbox-response";
import { authorize, refreshToken } from "./authorisation";
import { InternalProps } from "./sdk";
import { assertIsPushedFileMeta } from "./types/postbox";

const getCreatePostboxUrl = ({
    applicationId,
    session,
    callbackUrl,
}: ConsentOnceOptions): string => {

    assertIsSession(session);

    if (!isNonEmptyString(callbackUrl)) {
        throw new TypeValidationError("Parameter callbackUrl should be string");
    }
    if (!isNonEmptyString(applicationId)) {
        throw new TypeValidationError("Parameter applicationId should be string");
    }

    return getFormattedDeepLink(
        DigimePaths.CREATE_POSTBOX,
        applicationId,
        new URLSearchParams({ callbackUrl }),
    );
};

const getPostboxImportUrl = () => "digime://postbox/import";

const getCreatePostboxWithAccessTokenUrl  = async ({
    redirectUri,
    state,
    applicationId,
    contractId,
    privateKey,
    sdkOptions,
}: ConsentOngoingAccessOptions & InternalProps): Promise<GetAuthorizationUrlResponse> => {

    if (!areNonEmptyStrings([applicationId, contractId, redirectUri, privateKey])) {
        // tslint:disable-next-line:max-line-length
        throw new TypeValidationError("Details should be a plain object that contains the properties applicationId, contractId, privateKey and redirectUri");
    }

    const {code, codeVerifier, session} = await authorize({
        applicationId,
        contractId,
        privateKey,
        redirectUri,
        state,
        sdkOptions,
    });

    return {
        url: getFormattedDeepLink(
            DigimePaths.CREATE_POSTBOX,
            applicationId,
            new URLSearchParams({
                code,
                callbackUrl: redirectUri,
            }),
        ),
        codeVerifier,
        session,
    };
};

const pushDataToPostbox = async ({
    applicationId,
    contractId,
    userAccessToken,
    privateKey,
    redirectUri,
    data,
    publicKey,
    postboxId,
    sessionKey,
    sdkOptions,
}: PushDataToPostboxOptions & InternalProps): Promise<PushDataToPostboxResponse> => {

    if (!areNonEmptyStrings([applicationId, contractId, publicKey, redirectUri, privateKey, postboxId])) {
        // tslint:disable-next-line:max-line-length
        throw new TypeValidationError("pushDataToPostbox requires the following properties to be set: applicationId, contractId, redirectUri, postboxId, publicKey, privateKey, sessionKey");
    }

    assertIsPushedFileMeta(data);

    // We have an access token, try and trigger a push request
    const result = await triggerPush({
        applicationId,
        contractId,
        privateKey,
        redirectUri,
        accessToken: userAccessToken?.accessToken.value,
        data,
        publicKey,
        postboxId,
        sessionKey,
        sdkOptions,
    });

    // If an access token was provided and the status is pending, it means the access token may have expired.
    if (result.status === "pending" && userAccessToken) {
        const newTokens: UserAccessToken = await refreshToken({
            applicationId,
            contractId,
            privateKey,
            redirectUri,
            userAccessToken,
            sdkOptions,
        });

        const secondPushResult = await triggerPush({
            applicationId,
            contractId,
            privateKey,
            redirectUri,
            accessToken: newTokens.accessToken.value,
            data,
            publicKey,
            postboxId,
            sessionKey,
            sdkOptions,
        });

        return {
            ...secondPushResult,
            updatedAccessToken: newTokens,
        }
    }

    return result;
};

interface InternalTriggerPushProps extends Omit<PushDataToPostboxOptions, "userAccessToken"> {
    accessToken: string | undefined,
}

const triggerPush = async ({
    accessToken,
    applicationId,
    contractId,
    redirectUri,
    sessionKey,
    postboxId,
    privateKey,
    publicKey,
    data,
    sdkOptions,
}: InternalTriggerPushProps & InternalProps): Promise<PushDataToPostboxAPIResponse> => {

    const key: string = getRandomHex(64);
    const rsa: NodeRSA = new NodeRSA(publicKey, "pkcs1-public");
    const encryptedKey: Buffer = rsa.encrypt(Buffer.from(key, "hex"));
    const ivString: string = getRandomHex(32);
    const iv: Buffer = Buffer.from(ivString, "hex");
    const encryptedData: Buffer = encryptData(
        iv,
        Buffer.from(key, "hex"),
        data.fileData,
    );
    const encryptedMeta: Buffer = encryptData(
        iv,
        Buffer.from(key, "hex"),
        Buffer.from(JSON.stringify(data.fileDescriptor), "utf8"),
    );
    const url: string = `${sdkOptions.baseUrl}/permission-access/postbox/${postboxId}`;
    const form: FormData = new FormData();
    form.append("file", encryptedData, data.fileName);

    const jwt: string = sign(
        {
            ...(accessToken && {access_token: accessToken}),
            client_id: `${applicationId}_${contractId}`,
            iv: ivString,
            metadata: encryptedMeta.toString("base64"),
            nonce: getRandomAlphaNumeric(32),
            redirect_uri: redirectUri,
            session_key: sessionKey,
            symmetrical_key: encryptedKey.toString("base64"),
            timestamp: new Date().getTime(),
        },
        privateKey.toString(),
        {
            algorithm: "PS512",
            noTimestamp: true,
        },
    );

    try {

        const { body } = await net.post(url, {
            headers: {
                contentType: "multipart/form-data",
                Authorization: `Bearer ${jwt}`,
            },
            body: form,
            retry: sdkOptions.retryOptions,
            responseType: "json",
        });

        assertIsPushDataStatusResponse(body)
        return body;
    } catch (error) {

        handleInvalidatedSdkResponse(error);
        throw error;
    }
}

export {
    getCreatePostboxUrl,
    getCreatePostboxWithAccessTokenUrl,
    getPostboxImportUrl,
    pushDataToPostbox,
    PushedFileMeta,
};
