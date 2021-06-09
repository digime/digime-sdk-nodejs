/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import { DigiMeSDKError } from "./errors";
import { CAAccountsResponse } from "./types/api/ca-accounts-response";
import { readFile } from "./read-file";
import NodeRSA from "node-rsa";
import { AcceptedSDKConfiguration } from "./types/dme-sdk-configuration";

interface ReadAccountsOptions {
    sessionKey: string;
    privateKey: NodeRSA.Key;
}

type ReadAccountsResponse = Pick<CAAccountsResponse, "accounts">;

const readAccounts = async (
    options: ReadAccountsOptions,
    sdkConfig: AcceptedSDKConfiguration
): Promise<ReadAccountsResponse> => {

    const { sessionKey, privateKey } = options;
    const {fileData} = await readFile({
        sessionKey,
        fileName: "accounts.json",
        privateKey
    }, sdkConfig);

    try {
        return {
            accounts: JSON.parse(fileData.toString("utf8")),
        };
    }
    catch(error) {
        throw new DigiMeSDKError("Account file is malformed.");
    }
};

export {
    readAccounts,
    ReadAccountsOptions,
    ReadAccountsResponse
};
