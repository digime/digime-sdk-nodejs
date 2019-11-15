/*!
 * Copyright (c) 2009-2020 digi.me Limited. All rights reserved.
 */

import isInteger from "lodash.isinteger";
import isPlainObjectLodash from "lodash.isplainobject";
import isString from "lodash.isstring";
import { DMESDKConfiguration, Session } from "./sdk";

export const isValidString = (o: unknown): o is string => isString(o) && o.length > 0;

export const isPlainObject = (o: unknown): o is { [key: string]: unknown } => isPlainObjectLodash(o);

export const isSessionValid = (session: unknown): session is Session => (
    isPlainObject(session) &&
    isInteger(session.expiry) &&
    isString(session.sessionKey) &&
    isString(session.sessionExchangeToken)
);

export const isConfigurationValid = (options: unknown): options is DMESDKConfiguration => (
    isPlainObject(options) && isString(options.baseUrl)
);

export const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
