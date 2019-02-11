/*!
 * Copyright (c) 2009-2018 digi.me Limited. All rights reserved.
 */

import isInteger from "lodash.isinteger";
import isPlainObjectLodash from "lodash.isplainobject";
import isString from "lodash.isstring";
import { DigiMeSDKConfiguration, Session } from "./sdk";

export const isValidString = (o: unknown): o is string => isString(o) && o.length > 0;

export const isPlainObject = (o: unknown): o is { [key: string]: unknown } => isPlainObjectLodash(o);

export const isSessionValid = (session: unknown): session is Session => (
    isPlainObject(session) &&
    isInteger(session.expiry) &&
    isString(session.sessionKey) &&
    isString(session.sessionExchangeToken)
);

export const areOptionsValid = (options: unknown): options is DigiMeSDKConfiguration => (
    isPlainObject(options) && isString(options.host) && isString(options.version)
);
