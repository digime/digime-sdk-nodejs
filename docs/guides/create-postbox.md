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

# Creating a Postbox

In order to push data to a user, the user needs to have a postbox. A postbox is a temporary secure storage that only you and your user can access. To create a postbox, the user needs to have the native digi.me application installed. Your user's digi.me will periodically import any data stored in their postboxes. You should create a new postbox for each [session](#establishing-a-session).

When creating a postbox, we need to check whether the contract is for a one off or an ongoing push. You should be notified of this when a contract is given to you.

NOTE: Your user needs to have the native digi.me client installed in order to create a Postbox.

## One Off Push

Use the [`authorize.once.getCreatePostboxUrl()`](../functions/authorize.md?#authorizeoncegetcreatepostboxurl) function to get a Url which can be used to trigger the native digi.me client to create a postbox. Once the user has given consent, the digi.me client will trigger the callbackUrl with the `postboxId` and `publicKey` in the query parameter.

Once a Postbox has been created, you can now push data into it. Next time the user logs in to digi.me, this data will be imported from their Postbox to their digi.me.

## Ongoing Push

Use the [`authorize.ongoing.getCreatePostboxUrl()`](../functions/authorize.md?#authorizeongoinggetcreatepostboxurl) function to get a Url which can be used to trigger the native digi.me client to create a postbox. You will also be returned a `codeVerifier` which we will need later to exchange for an access token.

Once the user has given consent, the digi.me client will trigger the `redirectUri` with the `postboxId` and `publicKey` in the query parameter as well as an `code`. Using the `codeVerifier` and this `code` we can exchange for an [access token](./access-token.md).


[Back to Index](../README.md)
