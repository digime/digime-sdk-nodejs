/*!
 * Copyright (c) 2009-2024 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

// NOTE: This mock is added to overcome jest timer mocks not working!!
export const sleep = (): Promise<void> => Promise.resolve();
