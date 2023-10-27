/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { defineConfig } from "vite";
export default defineConfig({
    test: {
        setupFiles: ["./vitest.setup.ts"],
        /**
         * NOTE: Disabling threads as it seems to reduce vitest hangs.
         * Also doesn't make "debug" package output in non-TTY mode.
         *
         * Reference:
         *  - https://github.com/vitest-dev/vitest/issues/3077
         *  - https://github.com/vitest-dev/vitest/issues/2008
         */
        threads: false,
        reporters: "verbose",
        coverage: {
            enabled: true,
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
