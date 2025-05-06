/*!
 * © World Data Exchange. All rights reserved.
 */

export const isString = (value: unknown): value is string => {
    return typeof value === "string";
};

export const isFunction = (value: unknown): value is (...args: unknown[]) => unknown => {
    return typeof value === "function";
};

export const isNonEmptyString = (o: unknown): o is string => isString(o) && o.length > 0;

export const areNonEmptyStrings = (o: unknown[]): o is string[] => o.every((value) => isNonEmptyString(value));

export const isNumber = (o: unknown): o is number => typeof o === "number";

const isPlainObjectCheck = (value: unknown): value is Record<string, unknown> => {
    if (Object.prototype.toString.call(value) !== "[object Object]") return false;

    const prototype = Object.getPrototypeOf(value);
    return prototype === null || prototype === Object.prototype;
};

export const isPlainObject = (o: unknown): o is { [key: string]: unknown } => isPlainObjectCheck(o);

export const addTrailingSlash = (url: unknown): string | undefined => {
    if (isNonEmptyString(url)) {
        return url.endsWith("/") ? url : `${url}/`;
    }
    return undefined;
};

export const addLeadingSlash = (url: unknown): string | undefined => {
    if (isNonEmptyString(url)) {
        return url.startsWith("/") ? url : `/${url}`;
    }
    return undefined;
};

export const addLeadingAndTrailingSlash = (url: unknown): string | undefined => {
    if (isNonEmptyString(url)) {
        return url.replace(/^\/?([^/]+(?:\/[^/]+)*)\/?$/, "/$1/");
    }
    return "/";
};
