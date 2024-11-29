/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import fs from "node:fs";

const fileContent = `/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

export default "${String(process.env.npm_package_version)}";
`;

fs.writeFile("./src/sdk-version.ts", fileContent, (err) => {
    if (err) {
        throw err;
    }
});
