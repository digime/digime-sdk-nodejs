/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

/**
 * Generic catch-all Error thrown by the SDK.
 */
export class DigiMeSdkError extends Error {
    public name = "DigiMeSdkError";

    constructor(message: Error["message"]) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Thrown if a data structure fails to be what was expected
 */
export class DigiMeSdkTypeError extends DigiMeSdkError {
    public name = "DigiMeSdkTypeError";
}

/**
 * Thrown when a parseable error response is received from Digi.me API.
 */
export class DigiMeSdkApiError extends DigiMeSdkError {
    public name = "DigiMeServerError";

    // TODO: Accept ApiError, format message automatically?
}

/**
 * Thrown if the current SDK or its version is invalid according to the Digi.me API
 */
export class DigiMeSdkInvalidError extends DigiMeSdkApiError {
    public name = "DigiMeSdkInvalidError";
}
