/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { UserAuthorization } from "../user-authorization";
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

    /**
     * Attempt to refresh the instance of UserAuthorization attached to this instance and recieve a new one in return
     *
     * **NOTE**: This will also trigger this instances `onUserAuthorizationUpdated` callback, if one was provided!
     */
    async refreshUserAuthorization(): Promise<UserAuthorization> {
        const newUserAuthorization = await this.#config.digiMeSdkInstance.refreshUserAuthorization({
            userAuthorization: this.#config.userAuthorization,
        });

        // Call the update hook
        if (this.#config.onUserAuthorizationUpdated) {
            this.#config.onUserAuthorizationUpdated({
                oldUserAuthorization: this.#config.userAuthorization,
                newUserAuthorization,
            });
        }

        this.#config.userAuthorization = newUserAuthorization;

        return newUserAuthorization;
    }

    async #getCurrentUserAuthorizationOrThrow() {
        const { access_token, refresh_token } = this.#config.userAuthorization.asPayload();

        const now = Math.floor(Date.now() / 1000);
        const accessTokenExpired = access_token.expires_on + 10 > now;

        if (!accessTokenExpired) {
            return this.#config.userAuthorization;
        }

        const refreshTokenExpired = refresh_token.expires_on + 10 > now;

        if (refreshTokenExpired) {
            throw new DigiMeSdkTypeError(errorMessages.accessAndRefreshTokenExpired);
        }

        return await this.refreshUserAuthorization();
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
