/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { jwtVerify } from "jose";
import { z } from "zod";
import { jwksFromJku } from "./jwks-from-jku";

/**
 * Retrieve JKU verified payload from any given token
 */
export async function getTokenPayload(token: string): Promise<unknown>;
export async function getTokenPayload<T extends z.ZodTypeAny>(token: string, payloadSchema: T): Promise<z.infer<T>>;
export async function getTokenPayload<T extends z.ZodTypeAny>(token: string, payloadSchema?: T): Promise<z.infer<T>> {
    return (payloadSchema ?? z.record(z.unknown())).parse((await jwtVerify(token, jwksFromJku)).payload);
}
