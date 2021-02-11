![](https://securedownloads.digi.me/partners/digime/SDKReadmeBanner.png)
<p align="center">
    <a href="https://developers.digi.me/slack/join">
        <img src="https://img.shields.io/badge/chat-slack-blueviolet.svg" alt="Developer Chat">
    </a>
    <a href="LICENSE">
        <img src="https://img.shields.io/badge/license-apache 2.0-blue.svg" alt="Apache 2.0 License">
    </a>
    <a href="#">
    	<img src="https://img.shields.io/badge/build-passing-brightgreen.svg">
    </a>
    <a href="https://www.typescriptlang.org/">
        <img src="https://img.shields.io/badge/language-typescript-ff69b4.svg" alt="Typescript">
    </a>
    <a href="https://developers.digi.me/">
        <img src="https://img.shields.io/badge/web-digi.me-red.svg" alt="Web">
    </a>
</p>

<br>

# Handling Errors

By default, the SDK retries to make calls twice before giving up. This is something that can be configured when the SDK is [initialised](./initialise-sdk.md).

## Error Types

These errors with be thrown if there is an error during SDK execution.

`HTTPError` - This is the default type of error we throw when we receive a server side error.

`TypeValidationError` - Thrown if the function parameters or a value are not of the expected type.

`SDKVersionInvalidError` - Thrown if the current version of the SDK is disabled.

`SDKInvalidError` - Thrown if the current SDK is invalid.

`FileDecryptionError` - Thrown if there is an issue when decrypting user files.

`ServerIdentityError` - Thrown if there's a mismatch of certificates when communicating with our production server.

## Troubleshooting Common Issues

`Receiving a 404 HTTPError when trying to establish a session`

This normally happens when either the application and/or contract ID is incorrect. You may get a `InvalidContractId` or `InvalidConsentAccessApplication` message in the code property of the error.
Make sure that they have not been swapped around. Also check that the contract Id is used in the correct environment.

`Receiving onFileError callbacks when calling getSessionData`

This can happen when the private key that you're using to decrypt user data is incorrect or not in the correct format. Make sure that the private key is in the PKCS1 format.


## Further Issues

If, after reading this section, your issue persists, please contact digi.me developer support. You can find FAQs and create a support ticket by visiting [digi.me support](http://digi.me/support). Alternatively you can email dev support by sending an email to support@digi.me

-----

[Back to Index](./README.md)
