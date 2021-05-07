/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import * as t from "io-ts";
import { RetryOptionsCodec, RetryOptions } from "./retry-options";
import { codecAssertion, CodecAssertion } from "../utils/codec-assertion";

export interface SDKConfiguration {
    applicationId: string;
    baseUrl?: string;
    onboardUrl?: string;
    retryOptions?: RetryOptions,
};

export const SDKConfigurationCodec: t.Type<SDKConfiguration> = t.intersection([
    t.type({
        applicationId: t.string,
    }),
    t.partial({
        baseUrl: t.string,
        onboardUrl: t.string,
        retryOptions: RetryOptionsCodec,
    }),
]);

export const isSDKConfiguration = SDKConfigurationCodec.is;

export const assertIsSDKConfiguration: CodecAssertion<SDKConfiguration> = codecAssertion(SDKConfigurationCodec);
