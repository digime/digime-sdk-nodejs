/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import * as t from "io-ts";
import { ThrowReporter } from "io-ts/lib/ThrowReporter";
import { TypeValidationError } from "../errors";
import { sprintf } from "sprintf-js";

export const codecAssertion = <T extends t.Mixed>(codec: T) => {
    return (value: unknown, message = "%s"): asserts value is t.TypeOf<T> => {
        try {
            ThrowReporter.report(codec.decode(value));
        } catch (error) {
            if (!(error instanceof Error)) {
                throw error;
            }
            throw new TypeValidationError(sprintf(message, error.message));
        }
    };
};

export type CodecAssertion<T> = (value: unknown, message?: string) => asserts value is T;
