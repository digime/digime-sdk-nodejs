/*!
 * Copyright (c) 2009-2020 digi.me Limited. All rights reserved.
 */

import FormData from "form-data";
import NodeRSA from "node-rsa";
import { encryptData, getRandomHex } from "./crypto";
import { TypeValidationError } from "./errors";
import { net, handleInvalidatedSdkResponse } from "./net";
import { DMESDKConfiguration, Session } from "./sdk";
import sdkVersion from "./sdk-version";
import { PushedFileMeta } from "./types";
import { isValidString } from "./utils";
import { assertIsSession } from "./types/api/session";

const getCreatePostboxUrl = (appId: string, session: Session, callbackUrl: string) => {

    assertIsSession(session);

    if (!isValidString(callbackUrl)) {
        throw new TypeValidationError("Parameter callbackUrl should be string");
    }
    if (!isValidString(appId)) {
        throw new TypeValidationError("Parameter appId should be string");
    }
    // tslint:disable-next-line:max-line-length
    return `digime://postbox/create?sessionKey=${session.sessionKey}&callbackUrl=${encodeURIComponent(callbackUrl)}&appId=${appId}&sdkVersion=${sdkVersion}&resultVersion=2`;
};

const getPostboxImportUrl = () => "digime://postbox/import";

const pushDataToPostbox = async (
    sessionKey: string,
    postboxId: string,
    publicKey: string,
    data: PushedFileMeta,
    options: DMESDKConfiguration,
): Promise<any> => {
    if (!isValidString(sessionKey)) {
        throw new TypeValidationError("Parameter sessionKey should be string");
    }
    if (!isValidString(publicKey)) {
        throw new TypeValidationError("Parameter publicKey should be string");
    }
    if (!isValidString(postboxId)) {
        throw new TypeValidationError("Parameter postboxId should be string");
    }

    const key: string = getRandomHex(64);
    const rsa: NodeRSA = new NodeRSA(Buffer.from(publicKey, "utf8"), "pkcs1-public");
    const encryptedKey: Buffer = rsa.encrypt(Buffer.from(key, "hex"));
    const ivString: string = getRandomHex(32);
    const iv: Buffer = Buffer.from(ivString, "hex");
    const encryptedData: Buffer = encryptData(
        iv,
        Buffer.from(key, "hex"),
        Buffer.from(data.fileData, "base64"),
    );
    const encryptedMeta: Buffer = encryptData(
        iv,
        Buffer.from(key, "hex"),
        Buffer.from(JSON.stringify(data.fileDescriptor), "utf8"),
    );
    const url: string = `${options.baseUrl}/permission-access/postbox/${postboxId}`;
    const form: FormData = new FormData();
    form.append("file", encryptedData, data.fileName);

    const headers = {
        contentType: "multipart/form-data",
        sessionKey,
        metadata: encryptedMeta.toString("base64"),
        symmetricalKey: encryptedKey.toString("base64"),
        iv: ivString,
    };

    try {
        const response = await net.post(url, {
            headers,
            body: form,
            retry: options.retryOptions,
            responseType: "json",
        });

        return response.body;

    } catch (error) {

        handleInvalidatedSdkResponse(error);

        throw error;
    }
};

export {
    getCreatePostboxUrl,
    getPostboxImportUrl,
    pushDataToPostbox,
    PushedFileMeta,
};
