/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

/**
 * NOTE: Update this string when updating copyright comments end year
 *
 * Seemingly, this would be trivial to replace with `new Date().getFullYear()` to ensure the current year, but
 * it would have a few problems:
 *
 * - Check Pattern - Programmatic current year: Lints ran against old code snapshots would fail in future years due to code not changing
 * - Check Pattern - RegExp any year: Any year would be valid, but bulk updating would require to modify the RegExp temporarily to enable autofixes
 * - Fix Template - Programmatic current year: Automatically including the current year would conflict with a fixed check pattern
 *
 * Therefore I believe updating both in sync when appropriate is the most reasonable option.
 */
const copyrightYearTo = "2024";

module.exports = {
    env: {
        node: true,
        es6: true,
    },
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint", "header", "unicorn"],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:prettier/recommended",
    ],
    rules: {
        "header/header": [
            "error",
            "block",
            {
                pattern: `^\\!\\r?\\n \\* Copyright \\(c\\) 2009-${copyrightYearTo} World Data Exchange Holdings Pty Limited \\(WDXH\\)\\. All rights reserved\\.\\r?\\n( \\* ?\\r?\\n( \\*(.*)?\\r?\\n)*)? $`,
                template: `!\n * Copyright (c) 2009-${copyrightYearTo} World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.\n `,
            },
            2,
        ],
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-empty-interface": [
            "error",
            {
                allowSingleExtends: true,
            },
        ],
        "@typescript-eslint/ban-ts-comment": [
            "error",
            {
                "ts-expect-error": "allow-with-description",
            },
        ],
        "unicorn/error-message": "error",
        "unicorn/expiring-todo-comments": "error",
        "unicorn/explicit-length-check": "error",
        "unicorn/new-for-builtins": "error",
        "unicorn/no-array-callback-reference": "error",
        "unicorn/no-array-for-each": "error",
        "unicorn/no-array-push-push": "error",
        "unicorn/no-for-loop": "error",
        "unicorn/no-instanceof-array": "error",
        "unicorn/no-lonely-if": "error",
        "unicorn/no-new-array": "error",
        "unicorn/no-new-buffer": "error",
        "unicorn/prefer-array-find": "error",
        "unicorn/prefer-array-flat-map": "error",
        "unicorn/prefer-array-index-of": "error",
        "unicorn/prefer-array-some": "error",
        "unicorn/prefer-date-now": "error",
        "unicorn/prefer-keyboard-event-key": "error",
        "unicorn/prefer-negative-index": "error",
        "unicorn/prefer-query-selector": "error",
        "unicorn/prefer-regexp-test": "error",
        "unicorn/prefer-string-slice": "error",
        "unicorn/prefer-type-error": "error",
        "unicorn/throw-new-error": "error",

        // NOTE: Evaluate behaviour
        "unicorn/better-regex": "error",
        "unicorn/no-abusive-eslint-disable": "error",
        "unicorn/no-object-as-default-parameter": "error",
        "unicorn/prefer-default-parameters": "error",
    },
};
