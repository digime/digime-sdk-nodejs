/*!
 * Copyright (c) 2009-2023 World Data Exchange Holdings Pty Limited (WDXH). All rights reserved.
 */

export const errorMessages = {
    /** A method was called that requires an OAuth token, but is wasn't provided yet */
    noOauthTokenProvided: [
        "You tried to call a method that needs a token, but you didn't provide it.",
        "",
        "You can provide it by:",
        ' • Instantiating the DigiMeSDK instance with the "token" option',
        " • Calling the `.setToken()` method on the SDK instance",
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
        "SDK tried to refresh the UserAuthorization that has expired, but the provided UserAuthorization's refresh token has also expired",

    gettingUntrustedJwksKeyResolver: [
        "Attempted to get a JWKS key resolver for an URL that has not yet been added as a trusted JWKS URL.",
        "",
        "A JWKS URL is marked as trusted when:",
        "• You manually call `addUrlAsTrustedJWKS` with a URL",
        "• Instantiate a DigiMeSDK instance with a `baseUrl` other than the default one,",
        '  This adds "<baseUrl>/jwks/oauth" as a trusted JWKS URL',
    ].join("\n"),
} satisfies Record<string, string>;
