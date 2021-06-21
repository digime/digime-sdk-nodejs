/*!
 * Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
 */

import fs from "fs";

const fileContent = `/*!
* Copyright (c) 2009-2021 digi.me Limited. All rights reserved.
*/

export default "${process.env.npm_package_version}";
`;

fs.writeFile("./src/sdk-version.ts", fileContent, (err) => {
    if (err) {
        throw err;
    }
});
