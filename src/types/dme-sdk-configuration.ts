/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import * as t from "io-ts";
import { RetryOptionsCodec, RetryOptions } from "./retry-options";
import { codecAssertion, CodecAssertion } from "../codec-assertion";

export interface DMESDKConfiguration {
    baseUrl: string;
    retryOptions?: RetryOptions,
};

export const DMESDKConfigurationCodec: t.Type<DMESDKConfiguration> = t.intersection([
    t.type({
        baseUrl: t.string,
    }),
    t.partial({
        retryOptions: RetryOptionsCodec,
    }),
]);

export const isDMESDKConfiguration = DMESDKConfigurationCodec.is;

export const assertIsDMESDKConfiguration: CodecAssertion<DMESDKConfiguration> = codecAssertion(DMESDKConfigurationCodec);
