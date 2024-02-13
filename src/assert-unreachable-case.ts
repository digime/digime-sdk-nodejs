/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { DigiMeSdkTypeError } from "./errors/errors";

/**
 * Always throws if called.
 * Useful for typechecking exhaustive switch statements.
 */
export const assertUnreachableCase = (
    value: never,
    message: string = `Encountered unreachable case: ${value}`,
): never => {
    throw new DigiMeSdkTypeError(message);
};
