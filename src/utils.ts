/*!
 * Copyright (c) 2009-2020 digi.me Limited. All rights reserved.
 */

import isPlainObjectLodash from "lodash.isplainobject";
import isString from "lodash.isstring";

export const isValidString = (o: unknown): o is string => isString(o) && o.length > 0;

export const isNumber = (o: unknown): o is number => typeof o === "number";

export const isPlainObject = (o: unknown): o is { [key: string]: unknown } => isPlainObjectLodash(o);
