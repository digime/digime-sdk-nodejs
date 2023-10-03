/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    dts: true,
    format: ["cjs", "esm"],
    sourcemap: true,
    clean: true,
});
