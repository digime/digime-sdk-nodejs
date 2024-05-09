/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import isPlainObjectLodash from "lodash.isplainobject";
import isString from "lodash.isstring";

export const isNonEmptyString = (o: unknown): o is string => isString(o) && o.length > 0;

export const areNonEmptyStrings = (o: unknown[]): o is string[] => o.every((value) => isNonEmptyString(value));

export const isNumber = (o: unknown): o is number => typeof o === "number";

export const isPlainObject = (o: unknown): o is { [key: string]: unknown } => isPlainObjectLodash(o);

export const addTrailingSlash = (url: unknown): string | undefined => {
    if (isNonEmptyString(url)) {
        return url.slice(-1) !== "/" ? `${url}/` : url;
    }
    return undefined;
};
