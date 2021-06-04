/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import * as t from "io-ts";
import { RetryOptionsCodec, RetryOptions } from "./retry-options";
import { codecAssertion, CodecAssertion } from "../codec-assertion";
import { BasicOAuthOptions, BasicOAuthOptionsCodec } from "./common";

export interface DMESDKConfiguration {
    authorizationConfig: BasicOAuthOptions;
    baseUrl?: string;
    onboardUrl?: string;
    retryOptions?: RetryOptions,
};

export type BasicSDKConfiguration = Omit<DMESDKConfiguration, "authorizationConfig">

export const DMESDKConfigurationCodec: t.Type<DMESDKConfiguration> = t.intersection([
    t.type({
        authorizationConfig: BasicOAuthOptionsCodec,
    }),
    t.partial({
        baseUrl: t.string,
        onboardUrl: t.string,
        retryOptions: RetryOptionsCodec,
    }),
]);

export const isDMESDKConfiguration = DMESDKConfigurationCodec.is;

export const assertIsDMESDKConfiguration: CodecAssertion<DMESDKConfiguration> = codecAssertion(DMESDKConfigurationCodec);

export type MinDMESDKConfiguration = Omit<DMESDKConfiguration, "authorizationConfig">
