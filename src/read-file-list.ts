/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { sign } from "jsonwebtoken";
import NodeRSA from "node-rsa";
import { getRandomAlphaNumeric } from "./crypto";
import { net } from "./net";
import { assertIsCAFileListResponse, CAFileListResponse } from "./types/api/ca-file-list-response";
import { SDKConfiguration } from "./types/sdk-configuration";
import { UserAccessToken } from "./types/user-access-token";
import { refreshTokenWrapper } from "./utils/refresh-token-wrapper";
import { ContractDetails } from "./types/common";

interface ReadFileListOptions {
    sessionKey: string;
    contractId: string;
    privateKey: NodeRSA.Key;
    userAccessToken: UserAccessToken;
}

interface ReadFileListOptionsFormated {
    sessionKey: string;
    userAccessToken: UserAccessToken;
    contractDetails: ContractDetails;
}

const _readFileList = async (
    options: ReadFileListOptionsFormated,
    sdkConfig: SDKConfiguration
): Promise<CAFileListResponse> => {
    const url = `${sdkConfig.baseUrl}permission-access/query/${options.sessionKey}`;
    const { userAccessToken } = options;
    const { contractId, privateKey } = options.contractDetails;

    const jwt: string = sign(
        {
            access_token: userAccessToken.accessToken.value,
            client_id: `${sdkConfig.applicationId}_${contractId}`,
            nonce: getRandomAlphaNumeric(32),
            timestamp: Date.now(),
        },
        privateKey.toString(),
        {
            algorithm: "PS512",
            noTimestamp: true,
        }
    );
    const response = await net.get(url, {
        headers: {
            Authorization: `Bearer ${jwt}`,
        },
        responseType: "json",
        retry: sdkConfig.retryOptions,
    });

    // Start of temporary solution for error format until BE adds improvement for this

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentFileListResponse: any = response.body;

    for (const key in currentFileListResponse?.status?.details) {
        if (currentFileListResponse.status.details.hasOwnProperty.call(currentFileListResponse.status.details, key)) {
            const item = currentFileListResponse.status.details[key];

            if (item.state === "partial" && item.error) {
                let code = item.error?.code;
                const statusCode = item.error?.statuscode || item.error?.statusCode;
                let message = item.error?.message;
                let reauth;
                let retryAfter;
                let objectTypeErrors;
                if (item.error?.error) {
                    message = item.error?.error?.message;
                    reauth = item.error?.error?.reauth;
                    retryAfter = item.error?.error?.retryAfter;
                    if (statusCode === 206 && code !== "SyncInProgress") {
                        if (item.error.objectTypeErrors) {
                            objectTypeErrors = item.error.objectTypeErrors;
                        } else {
                            try {
                                const parsedMessages = JSON.parse(item.error.error.message);
                                objectTypeErrors = [];
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                parsedMessages.map((parsedMessage: any) => {
                                    objectTypeErrors.push({
                                        error: {
                                            code: parsedMessage.error.code.toString(),
                                            message: parsedMessage.error.error.message,
                                            statusCode: parsedMessage.error.statuscode,
                                        },
                                        objectType: parsedMessage.objectType,
                                    });
                                });
                                code = "PartialObjectTypes";
                                message = "Errors occured for some object types";
                            } catch {
                                // skip parsing of message if parsing is not possible
                            }
                        }
                    }
                }
                currentFileListResponse.status.details[key].error = {
                    code,
                    statusCode,
                    message,
                    reauth,
                    retryAfter,
                    objectTypeErrors,
                };
            }
        }
    }

    assertIsCAFileListResponse(currentFileListResponse);

    // End of temporary solution for error format until BE adds improvement for this

    return {
        ...currentFileListResponse,
        userAccessToken,
    };
};

const readFileList = async (
    props: ReadFileListOptions,
    sdkConfiguration: SDKConfiguration
): Promise<CAFileListResponse> => {
    const formatedOptions: ReadFileListOptionsFormated = {
        sessionKey: props.sessionKey,
        userAccessToken: props.userAccessToken,
        contractDetails: {
            contractId: props.contractId,
            privateKey: props.privateKey.toString(),
        },
    };
    return refreshTokenWrapper(_readFileList, formatedOptions, sdkConfiguration);
};

export { readFileList, ReadFileListOptions, CAFileListResponse as ReadFileListResponse };
