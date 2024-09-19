/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
/** @type {function():import("ignore").Ignore} */
// @ts-expect-error bad types
const ignore = require("ignore");
const fs = require("fs-extra");
const path = require("path");
/* eslint-enable @typescript-eslint/no-require-imports */

const eslintignoreContent = fs.readFileSync(".eslintignore").toString();
const isIgnored = ignore().add(eslintignoreContent).createFilter();

/** @type {function(string[]):string[]} */
const filterIgnoredPaths = (filePaths) => {
    const cwd = process.cwd();
    const filteredPaths = filePaths.filter((filePath) => isIgnored(path.relative(cwd, filePath)));
    return filteredPaths;
};

module.exports = filterIgnoredPaths;
