/*!
 * Copyright (c) 2009-2018 digi.me Limited. All rights reserved.
 */

import FormData from "form-data";
import { HTTPError } from "got";
import get from "lodash.get";
import NodeRSA from "node-rsa";
import { encryptData, getRandomHex } from "./crypto";
import { ParameterValidationError, SDKInvalidError, SDKVersionInvalidError } from "./errors";
import { net } from "./net";
import { DigiMeSDKConfiguration, FileMeta, isSessionValid, Session } from "./sdk";
import sdkVersion from "./sdk-version";
import { isValidString } from "./utils";

interface PushedFileMeta {
    mimeType: string;
    accounts: MetaAccount[];
    reference?: string[];
    tags?: string[];
}

interface MetaAccount {
    accountId: string;
}

const getPostboxURL = (appId: string, session: Session, callbackURL: string) => {
    if (!isSessionValid(session)) {
        throw new ParameterValidationError(
            "Session should be an object that contains expiry as number and sessionKey property as string",
        );
    }
    if (!isValidString(callbackURL)) {
        throw new ParameterValidationError("Parameter callbackURL should be string");
    }
    if (!isValidString(appId)) {
        throw new ParameterValidationError("Parameter appId should be string");
    }
    // tslint:disable-next-line:max-line-length
    return `digime://postbox/create?sessionKey=${session.sessionKey}&callbackURL=${encodeURIComponent(callbackURL)}&appId=${appId}&sdkVersion=${sdkVersion}`;
};

const getPushCompletionURL = (sessionKey: string, postboxId: string, callbackURL: string) => {
    if (!isValidString(sessionKey)) {
        throw new ParameterValidationError("Parameter sessionKey should be string");
    }
    if (!isValidString(callbackURL)) {
        throw new ParameterValidationError("Parameter callbackURL should be string");
    }
    if (!isValidString(postboxId)) {
        throw new ParameterValidationError("Parameter postboxId should be string");
    }
    // tslint:disable-next-line:max-line-length
    return `digime://postbox/push-complete?sessionKey=${sessionKey}&postboxId=${postboxId}&callbackURL=${encodeURIComponent(callbackURL)}&sdkVersion=${sdkVersion}`;
};

const pushDataToPostbox = async (
    sessionKey: string,
    postboxId: string,
    publicKey: string,
    data: FileMeta<PushedFileMeta>,
    options: DigiMeSDKConfiguration,
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
    const url: string = `https://${options.host}/${options.version}/permission-access/postbox/${postboxId}`;
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
    getPostboxURL,
    getPushCompletionURL,
    pushDataToPostbox,
    PushedFileMeta,
};
