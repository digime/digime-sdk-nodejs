/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import fs from "node:fs";
import { Readable } from "node:stream";

export const getResponseData = (path: string): ReadableStream => {
    const filePath = new URL(`./handlers/${path}`, import.meta.url);
    return Readable.toWeb(fs.createReadStream(filePath)) as ReadableStream;
};
