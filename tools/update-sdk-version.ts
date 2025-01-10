/*!
 * © World Data Exchange. All rights reserved.
 */

import fs from "node:fs";

const fileContent = `/*!
 * © World Data Exchange. All rights reserved.
 */

export default "${String(process.env.npm_package_version)}";
`;

fs.writeFile("./src/sdk-version.ts", fileContent, (err) => {
    if (err) {
        throw err;
    }
});
