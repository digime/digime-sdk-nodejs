---
title: Handling Errors
---

# Handling Errors

By default, the SDK retries calls twice before giving up. This behavior can be configured when the SDK is [initialised](initializing-the-sdk.md).

## Errors Returned From our API

These are errors thrown by our API. They will be returned as `ServerError`, containing an error object that specifies the details of the error.

```
import { ServerError } from "@digime/digime-sdk-nodejs";

// ... init the sdk

try {
    const response = await sdk.getAuthorizeUrl(parameters);
} catch (e) {

    // Check if it's a server error
    if (e instanceof ServerError) {

        // e.error is an object containing a code and a message
        const {code, message} = e.error
        return res.status(500).json({ code, message });

        // For example when the redirect URL is invalid:
        // code: InvalidRedirectUri
        // message: "The redirect_uri (${redirectUri}) is invalid"
    }

    res.status(500).json({ error });
}
```

Some common errors returned from SDK:

| Code                        | Message                                                                    | Description                                                                         |
| --------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `InvalidRedirectUri`        | `The redirect_uri (${redirectUri}) is invalid`                             | The redirect URL that was supplied in the contract details was not valid.           |
| `InvalidToken`              | `The token (${tokenType}) is invalid`                                      | The user access token or refresh token was invalid.                                 |
| `InvalidClient`             | `The client_id (${clientId}) is invalid`                                   | The contract and/or application ID is invalid for this environment.                 |
| `InsufficientScope`         | `The request requires higher privileges than provided by the access token` | The contract used is only for one off read.                                         |
| `SDKVersion`                |                                                                            | This SDK is not recognised.                                                         |
| `SDKVersionInvalid`         |                                                                            | This SDK version is no longer supported.                                            |
| `ServiceAuthorizationError` | Service authorization required                                             | This account needs to be [reauthroized](./manage-accounts/reauthorizing-account.md) |

## Type Validation Errors

`TypeValidationError` are thrown when the parameters passed in fail runtime type checks.

## Decryption Errors

When decrypting files from digi.me, if an incorrect private key is provided, `FileDecryptionError` will be thrown.

## Other Errors

`DigiMeSDKError` - Thrown for other generic errors in the SDK.

## Further Issues

If, after reading this section, your issue persists, please contact digi.me developer support. You can find FAQs and create a support ticket by visiting [digi.me support](http://digi.me/support). Alternatively you can email dev support by sending an email to support@worlddataexchange.com
