/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import * as t from "io-ts";
import { RetryOptionsCodec, RetryOptions } from "./retry-options";
import { codecAssertion, CodecAssertion } from "../codec-assertion";
import { BasicOAuthOptions, BasicOAuthOptionsCodec } from "./common";

export interface DMESDKConfiguration{
    authConfig: BasicOAuthOptions;
    baseUrl?: string;
    onboardUrl?: string;
    retryOptions?: RetryOptions,
};

export const DMESDKConfigurationCodec: t.Type<DMESDKConfiguration> = t.intersection([
    t.type({
        authConfig: BasicOAuthOptionsCodec,
    }),
    t.partial({
        baseUrl: t.string,
        onboardUrl: t.string,
        retryOptions: RetryOptionsCodec,
    }),
]);

export const isDMESDKConfiguration = DMESDKConfigurationCodec.is;

export const assertIsDMESDKConfiguration: CodecAssertion<DMESDKConfiguration> = codecAssertion(DMESDKConfigurationCodec);

export type MinDMESDKConfiguration = Omit<DMESDKConfiguration, "authConfig">
