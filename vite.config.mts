/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { defineConfig } from "vite";
export default defineConfig({
    test: {
        setupFiles: ["./vitest.setup.ts"],
        /**
         * NOTE: Switching from default "thread" pooling to "fork" pooling reduce vitest hangs.
         * Additioally, it also allows the "debug" package to output in TTY mode.
         *
         * Reference:
         *  - https://github.com/vitest-dev/vitest/issues/3077
         *  - https://github.com/vitest-dev/vitest/issues/2008
         */
        pool: "forks",
        reporters: "verbose",
        coverage: {
            enabled: true,
            reportOnFailure: true,
            include: ["src/**/*.ts"],
            reporter: ["cobertura", "lcovonly", "text-summary", "html"],
            thresholds: {
                branches: 25,
                functions: 25,
                lines: 30,
                statements: 30,
            },
        },
    },
});
