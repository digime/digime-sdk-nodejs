/*!
 * Copyright (c) 2009-2019 digi.me Limited. All rights reserved.
 */

import FormData from "form-data";
import { HTTPError } from "got";
import get from "lodash.get";
import NodeRSA from "node-rsa";
import { encryptData, getRandomHex } from "./crypto";
import { ParameterValidationError, SDKInvalidError, SDKVersionInvalidError } from "./errors";
import { net } from "./net";
import { DMESDKConfiguration, isSessionValid, Session } from "./sdk";
import sdkVersion from "./sdk-version";
import { PushedFileMeta } from "./types";
import { isValidString } from "./utils";

const getCreatePostboxUrl = (appId: string, session: Session, callbackUrl: string) => {
    if (!isSessionValid(session)) {
        throw new ParameterValidationError(
            "Session should be an object that contains expiry as number and sessionKey property as string",
        );
    }
    if (!isValidString(callbackUrl)) {
        throw new ParameterValidationError("Parameter callbackUrl should be string");
    }
    if (!isValidString(appId)) {
        throw new ParameterValidationError("Parameter appId should be string");
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
        throw new ParameterValidationError("Parameter sessionKey should be string");
    }
    if (!isValidString(publicKey)) {
        throw new ParameterValidationError("Parameter publicKey should be string");
    }
    if (!isValidString(postboxId)) {
        throw new ParameterValidationError("Parameter postboxId should be string");
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
        accept: "application/json",
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
        });

        return response.body;
    } catch (error) {

        if (!(error instanceof HTTPError)) {
            throw error;
        }

        const errorBody = error.body;
        const errorCode = get(isValidString(errorBody) ? JSON.parse(errorBody) : errorBody, "error.code");

        if (errorCode === "SDKInvalid") {
            throw new SDKInvalidError(get(error, "body.error.message"));
        }

        if (errorCode === "SDKVersionInvalid") {
            throw new SDKVersionInvalidError(get(error, "body.error.message"));
        }

        throw error;
    }
};

export {
    getCreatePostboxUrl,
    getPostboxImportUrl,
    pushDataToPostbox,
    PushedFileMeta,
};
