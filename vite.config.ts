/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { defineConfig } from "vite";
export default defineConfig({
    test: {
        setupFiles: ["./vitest.setup.ts"],
        coverage: {
            reportOnFailure: true,
            include: ["src/**/*.ts"],
            reporter: ["cobertura", "lcovonly", "text-summary", "html"],
            branches: 25,
            functions: 25,
            lines: 30,
            statements: 30,
        },
    },
});
