/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { mockApiInternals } from "./api-internals";
import { generateKeyPair, keyAsPkcs1PemString } from "./utilities";

const sdkConsumerKeyPair = await generateKeyPair();

export const mockSdkConsumerCredentials = {
    contractId: "mock-contract-id",
    applicationId: "mock-application-id",
    ...sdkConsumerKeyPair,
    privateKeyPkcs1PemString: keyAsPkcs1PemString(sdkConsumerKeyPair.privateKey),
    userAuthorizationJwt: await mockApiInternals.generateUserAuthorizationJwt(),
} as const;
