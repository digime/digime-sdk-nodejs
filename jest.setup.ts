/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

import { mswServer } from "./src/mocks/server";

beforeAll(() => {
    mswServer.listen();
});

afterEach(() => {
    mswServer.resetHandlers();
});

afterAll(() => {
    mswServer.close();
});
