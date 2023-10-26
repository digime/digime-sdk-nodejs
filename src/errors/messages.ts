/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

export const errorMessages = {
    /** A method was called that requires a TokenPair, but is wasn't provided yet */
    noTokenPairProvided: [
        "You tried to call a method that needs a TokenPair, but you didn't provide it.",
        "",
        "You can provide it by:",
        ' • Instantiating the DigiMeSDK instance with the "tokenPair" option',
        " • Calling the `.setTokenPair()` method on the SDK instance",
    ].join("\n"),

    /** A method was called that requires ContractDetails, but it wasn't provided yet */
    noContractDetailsProvided: [
        "You tried to call a method that needs ContractDetails, but you didn't provide them.",
        "",
        "You can provide them by:",
        ' • Instantiating the DigiMeSDK instance as "contractDetails" option',
        " • Calling the `.setContractDetails()` method on the SDK instance",
    ].join("\n"),

    /** Both access token and refresh token have expired */
    // TODO: Describe what to do in this situation. What to do is TBD.
    accessAndRefreshTokenExpired:
        "SDK tried to refresh the TokenPair's access token that has expired, but the provided refresh token has also expired",
} satisfies Record<string, string>;
