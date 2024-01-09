/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { AuthorizationCredentials } from "../authorization-credentials";
import { DigiMeSdkTypeError } from "../errors/errors";
import { errorMessages } from "../errors/messages";
import { parseWithSchema } from "../zod/zod-parse";
import { DigiMeSdkAuthorizedConfig } from "./config";

export class DigiMeSdkAuthorized {
    #config: DigiMeSdkAuthorizedConfig;

    constructor(config: DigiMeSdkAuthorizedConfig) {
        this.#config = parseWithSchema(
            config,
            DigiMeSdkAuthorizedConfig,
            'DigiMeSdkAuthorized constructor parameter "config"',
        );
    }

    async refreshAuthorizationCredentials(): Promise<AuthorizationCredentials> {
        const newAuthorizationCredentials = await this.#config.digiMeSdkInstance.refreshAuthorizationCredentials(
            this.#config.authorizationCredentials,
        );

        // Call the update hook
        if (this.#config.onAuthorizationCredentialsUpdated) {
            this.#config.onAuthorizationCredentialsUpdated({
                oldAuthorizationCredentials: this.#config.authorizationCredentials,
                newAuthorizationCredentials,
            });
        }

        this.#config.authorizationCredentials = newAuthorizationCredentials;

        return newAuthorizationCredentials;
    }

    async #getCurrentAuthorizationCredentialsOrThrow() {
        const { access_token, refresh_token } = this.#config.authorizationCredentials.asPayload();

        const now = Math.floor(Date.now() / 1000);
        const accessTokenExpired = access_token.expires_on + 10 > now;

        if (!accessTokenExpired) {
            return this.#config.authorizationCredentials;
        }

        const refreshTokenExpired = refresh_token.expires_on + 10 > now;

        if (refreshTokenExpired) {
            throw new DigiMeSdkTypeError(errorMessages.accessAndRefreshTokenExpired);
        }

        return await this.refreshAuthorizationCredentials();
    }

    readAccounts() {}

    readSession() {}

    getOnboardServiceUrl() {}

    getReauthorizeAccountUrl() {}

    deleteUser() {}

    getPortabilityReport() {}

    pushData() {}

    readAllFiles() {}

    readFile() {}

    readFileList() {}
}
