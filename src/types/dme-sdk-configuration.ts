/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import * as t from "io-ts";
import { RetryOptionsCodec, RetryOptions } from "./retry-options";
import { codecAssertion, CodecAssertion } from "../codec-assertion";
import { BasicOAuthOptions, BasicOAuthOptionsCodec } from "./common";

export interface SDKConfiguration {
    authorizationConfig: BasicOAuthOptions;
    baseUrl?: string;
    onboardUrl?: string;
    retryOptions?: RetryOptions,
};

export type BasicSDKConfiguration = Omit<SDKConfiguration, "authorizationConfig">

export type AcceptedSDKConfiguration = SDKConfiguration | BasicSDKConfiguration;

export const SDKConfigurationCodec: t.Type<SDKConfiguration> = t.intersection([
    t.type({
        authorizationConfig: BasicOAuthOptionsCodec,
    }),
    t.partial({
        baseUrl: t.string,
        onboardUrl: t.string,
        retryOptions: RetryOptionsCodec,
    }),
]);

export const isSDKConfiguration = SDKConfigurationCodec.is;

export const assertIsSDKConfiguration: CodecAssertion<SDKConfiguration> = codecAssertion(SDKConfigurationCodec);

export type MinSDKConfiguration = Omit<SDKConfiguration, "authorizationConfig">
