/*!
 * Copyright (c) 2009-2022 digi.me Limited. All rights reserved.
 */

// NOTE: This mock is added to overcome jest timer mocks not working!!
export const sleep = (): Promise<void> => Promise.resolve();
