/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import FormData from "form-data";
import NodeRSA from "node-rsa";
import { encryptData, getRandomAlphaNumeric, getRandomHex } from "./crypto";
import { sign } from "jsonwebtoken";
import { TypeValidationError } from "./errors";
import { net, handleInvalidatedSdkResponse } from "./net";
import { areNonEmptyStrings } from "./utils";
import { assertIsPushDataStatusResponse, PushDataToPostboxAPIResponse } from "./types/api/postbox-response";
import { assertIsPushedFileMeta } from "./types/postbox";
import { UserAccessToken } from "./types/user-access-token";
import { refreshToken } from "./refresh-token";
import { SDKConfiguration } from "./types/dme-sdk-configuration";

interface WriteOptions{
    userAccessToken: UserAccessToken;
    data: FileMeta;
    publicKey: NodeRSA.Key;
    postboxId: string;
    sessionKey?: string;
}

interface FileMeta {
    fileData: Buffer;
    fileName: string;
    fileDescriptor: {
        mimeType: string;
        accounts: Array<{
            accountId: string;
        }>;
        reference?: string[];
        tags?: string[];
    };
}

interface WriteResponse extends PushDataToPostboxAPIResponse {
    updatedAccessToken?: UserAccessToken;
}

const write = async (options: WriteOptions, sdkConfig: SDKConfiguration): Promise<WriteResponse> => {

    const {
        userAccessToken,
        data,
        publicKey,
        postboxId,
        sessionKey,
    } = options;

    if (!areNonEmptyStrings([publicKey, postboxId])) {
        // tslint:disable-next-line:max-line-length
        throw new TypeValidationError("pushDataToPostbox requires the following properties to be set: postboxId, publicKey, sessionKey");
    }

    assertIsPushedFileMeta(data);

    // We have an access token, try and trigger a push request
    const result = await triggerPush({
        accessToken: userAccessToken?.accessToken.value,
        data,
        publicKey,
        postboxId,
        sessionKey
    }, sdkConfig);

    // If an access token was provided and the status is pending, it means the access token may have expired.
    if (result.status === "pending" && userAccessToken) {
        const newTokens: UserAccessToken = await refreshToken( {userAccessToken}, sdkConfig );
        const secondPushResult = await triggerPush({
            accessToken: newTokens.accessToken.value,
            data,
            publicKey,
            postboxId,
        }, sdkConfig);

        return {
            ...secondPushResult,
            updatedAccessToken: newTokens,
        }
    }

    return result;
};

interface TriggerPushProps extends Omit<WriteOptions, "userAccessToken"> {
    accessToken: string | undefined,
}

const triggerPush = async (
    options: TriggerPushProps,
    sdkConfig: SDKConfiguration
): Promise<PushDataToPostboxAPIResponse> => {

    const { accessToken, postboxId, publicKey, data, sessionKey } = options;
    const { applicationId, contractId, privateKey, redirectUri } = sdkConfig.authorizationConfig;

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
    const url: string = `${sdkConfig.baseUrl}permission-access/postbox/${postboxId}`;
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
            retry: sdkConfig.retryOptions,
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
    write,
    WriteOptions,
    WriteResponse,
    FileMeta,
};
