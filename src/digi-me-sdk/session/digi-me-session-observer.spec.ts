/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import type { TestFunction } from "vitest";
import { describe, test } from "vitest";
import { mswServer } from "../../../mocks/server";
import { handlers as permissionAccessQueryHandlers } from "../../../mocks/api/permission-access/query/handlers";
import { UserAuthorization } from "../../user-authorization";
import { mockSdkConsumerCredentials } from "../../../mocks/sdk-consumer-credentials";
import { DigiMeSdk } from "../digi-me-sdk";
import { abortableDelay } from "../../abortable-delay";

const mockSdkOptions = {
    applicationId: mockSdkConsumerCredentials.applicationId,
    contractId: mockSdkConsumerCredentials.contractId,
    contractPrivateKey: mockSdkConsumerCredentials.privateKeyPkcs1PemString,
} as const satisfies ConstructorParameters<typeof DigiMeSdk>[0];

describe("DigiMeSessionObserver", () => {
    test.todo(
        "Returns the file list",
        mswServer.boundary<TestFunction>(async () => {
            mswServer.use(...permissionAccessQueryHandlers);

            const userAuthorization = await UserAuthorization.fromJwt(mockSdkConsumerCredentials.userAuthorizationJwt);
            const sdk = new DigiMeSdk(mockSdkOptions);
            const authorizedSdk = sdk.withUserAuthorization(userAuthorization, () => {});

            const observer = authorizedSdk.getSessionObserver({ sessionKey: "test-session-key" });

            observer.start({
                onFileReady: async (file) => {
                    console.log("onFileReady file:", file.fileName);
                    await abortableDelay(10);
                },
            });

            await abortableDelay(100000);
        }),
        { timeout: 100000 },
    );
});
