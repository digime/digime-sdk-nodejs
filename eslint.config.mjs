/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import tseslint from "typescript-eslint";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import js from "@eslint/js";
import headers from "eslint-plugin-headers";

export default [
    {
        ignores: ["**/coverage", "**/dist", "**/docs"],
    },
    js.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
            },
        },
    },

    eslintPluginUnicorn.configs["flat/recommended"],
    eslintPluginPrettier,
    {
        plugins: {
            headers,
        },
        rules: {
            "headers/header-format": [
                "error",
                {
                    source: "string",
                    blockPrefix: "!\n",
                    content:
                        "Copyright (c) 2009-{year} World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.",
                    variables: {
                        year: String(2024),
                    },
                },
            ],
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/no-confusing-void-expression": "off",
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
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    varsIgnorePattern: "^_",
                    argsIgnorePattern: "^_",
                },
            ],
            "unicorn/prevent-abbreviations": "off",
            "unicorn/filename-case": "off",
            "unicorn/no-null": "off",
            "unicorn/prefer-ternary": "off",
            "unicorn/prefer-global-this": "off",
            "unicorn/no-await-expression-member": "off",
            "prettier/prettier": "warn",
        },
    },
];
