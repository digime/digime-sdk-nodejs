/*!
 * Copyright (c) 2009-2019 digi.me Limited. All rights reserved.
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

class ParameterValidationError extends DigiMeSDKError {
    public name = "ParameterValidationError";
}

class FileDecryptionError extends DigiMeSDKError {
    public name = "FileDecryptionError";
}

class ServerIdentityError extends DigiMeSDKError {
    public name = "ServerIdentityError";
}

export {
    DigiMeSDKError,
    SDKInvalidError,
    SDKVersionInvalidError,
    ParameterValidationError,
    FileDecryptionError,
    ServerIdentityError,
};
