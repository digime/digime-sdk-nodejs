/*!
 * Copyright (c) 2009-2020 digi.me Limited. All rights reserved.
 */

// tslint:disable:max-classes-per-file
class DigiMeSDKError extends Error {
    public name = "DigiMeSDKError";

    constructor(message: Error["message"]) {
        super(message);
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

class OAuthError extends DigiMeSDKError {
    public name = "OAuthError";
}

class JWTVerificationError extends DigiMeSDKError {
    public name = "JWTVerificationError";
}

export {
    DigiMeSDKError,
    SDKInvalidError,
    SDKVersionInvalidError,
    TypeValidationError,
    FileDecryptionError,
    ServerIdentityError,
    OAuthError,
    JWTVerificationError,
};
