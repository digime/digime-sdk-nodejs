/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

export const concatUint8Array = (array1: Uint8Array, array2: Uint8Array): Uint8Array => {
    const newArray = new Uint8Array(array1.length + array2.length);
    newArray.set(array1, 0);
    newArray.set(array2, array1.length);
    return newArray;
};
