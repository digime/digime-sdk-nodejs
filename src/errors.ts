/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import { ApiError } from "./types/api/api-error-response";

// tslint:disable:max-classes-per-file
class DigiMeSDKError extends Error {
    public name = "DigiMeSDKError";
    public error?: ApiError;

    constructor(message: Error["message"], error?: ApiError) {
        super(message);
        this.error = error;
        Error.captureStackTrace(this, this.constructor);
    }
}

class SDKInvalidError extends DigiMeSDKError {
    public name = "SDKInvalidError";
}

class SDKVersionInvalidError extends DigiMeSDKError {
    public name = "SDKVersionInvalidError";
}

class TypeValidationError extends DigiMeSDKError {
    public name = "TypeValidationError";
}

class FileDecryptionError extends DigiMeSDKError {
    public name = "FileDecryptionError";
}

class ServerIdentityError extends DigiMeSDKError {
    public name = "ServerIdentityError";
}

class JWTVerificationError extends DigiMeSDKError {
    public name = "JWTVerificationError";
}

class TokenRefreshError extends DigiMeSDKError {
    public name = "TokenRefreshError";
}

class ServerError extends DigiMeSDKError {
    public name = "DigiMeServerError";
}

export {
    DigiMeSDKError,
    SDKInvalidError,
    SDKVersionInvalidError,
    TypeValidationError,
    FileDecryptionError,
    JWTVerificationError,
    ServerIdentityError,
    TokenRefreshError,
    ServerError,
};
