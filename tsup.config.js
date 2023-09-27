/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/**/*.ts", "!src/**/*.spec.ts"],
    dts: true,
    format: ["cjs", "esm"],
    sourcemap: true,
    clean: true,
    splitting: false,
});
