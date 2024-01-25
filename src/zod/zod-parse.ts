/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import type z from "zod";
import { ZodError } from "zod";
import { DigiMeSdkTypeError } from "../errors/errors";

/* ZodError issue formatter */
export const formatZodError = (error: ZodError, description?: string): string => {
    const result: string[] = [];

    for (const issue of error.issues) {
        // Construct path if there is one
        const path = issue.path.length > 0 ? `"${issue.path.join(".")}": ` : "";

        result.push(` • ${path}${issue.message}`);
    }

    const issueCount = `(${result.length} ${result.length === 1 ? "issue" : "issues"})`;

    return `Encountered an unexpected value ${
        typeof description === "string" ? `for ${description} ` : ""
    }${issueCount}:\n${result.join("\n")}`;
};

/* Parse zod schema wrapper */
export const parseWithSchema = <T extends z.ZodTypeAny>(
    value: Parameters<T["parse"]>[0],
    schema: T,
    description?: string,
    parseParams?: Parameters<T["parse"]>[1],
): z.infer<T> => {
    try {
        return schema.parse(value, parseParams);
    } catch (error) {
        // `ZodError` is probably the only thing the above throws, but rethrowing just in case
        if (!(error instanceof ZodError)) {
            throw error;
        }

        throw new DigiMeSdkTypeError(formatZodError(error, description));
    }
};
