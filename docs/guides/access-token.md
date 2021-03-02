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

# Access Token

In order to push or request data from the user's digi.me in the background, we will need an access token to their digi.me. In order to obtain this, we need two things: 
* A `code verifier` which we get when we first generate the [ongoing authorization](../functions/authorize.md) deep link.
* An `authorization code` which we get from the digi.me application after the user consents your request.

Once you have the above two, you can [exchange them](../functions/authorize.md#authorize-exchangeCodeForToken) for an access token.


## Ongoing push or pull

When you have an access token, you can include it the next time you request or push data to your users. This can be done without their need to consent again on the digi.me application since they have already consented to it in the initial request.

## Access Token Expiry

The access token will eventually expire. When you first created it, a timestamp in which it will expire will be returned. The SDK will attempt to refresh it automatically when you use it next. If a refresh is needed, it will return the new access token to you.

If the refresh is unsuccessful, you'll need to go through the authorization process again with the user. 


[Back to Index](../README.md)
