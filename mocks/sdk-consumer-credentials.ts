/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { KeyObject } from "crypto";
import { generateKeyPair } from "jose";
import { mockApiInternals } from "./api-internals";

export const keyAsPkcs1PemString = (key: unknown): string => {
    if (!(key instanceof KeyObject)) {
        throw new TypeError("Provided key is not a KeyObject");
    }

    const exportedKey = key.export({ type: "pkcs1", format: "pem" });

    if (typeof exportedKey === "string") return exportedKey;

    return exportedKey.toString("utf-8");
};

const sdkConsumerKeyPair = await generateKeyPair("PS512");

export const mockSdkConsumerCredentials = {
    contractId: "mock-contract-id",
    applicationId: "mock-application-id",
    ...sdkConsumerKeyPair,
    privateKeyPkcs1PemString: keyAsPkcs1PemString(sdkConsumerKeyPair.privateKey),
    userAuthorizationJwt: await mockApiInternals.generateUserAuthorizationJwt(),
} as const;
