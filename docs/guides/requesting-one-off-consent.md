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

# Requesting One Off Consent For Data Fetch

Before we fetch data from the user, we will need to ask our users for their consent.

In digi.me we provide two different ways to prompt user for a one off consent: For users who already have the digi.me application and for new users using the browser, using [guest consent](./#guest-consent).

## Using the digi.me application

This method targets existing users who already have the digi.me application installed on their desktop or mobile devices.
To trigger the consent screen, we can use the [`authorize.once.getPrivateShareConsentUrl`](../functions/authorize.md#authorize-once-getPrivateShareConsentUrl) method to get a Url which can be used to trigger the digi.me client to open on their desktop, Android or iOS devices. 

At the end of this process, the callback URL which you passed in will be called. If the user gave their consent, you will now be able to request user data.

## Guest Consent (Demo)
Note: This is a demo feature.

Whilst the true power of the digi.me Private Sharing platform lies in the user’s digi.me, and as such highly encourage developers to properly utilise this, we do facilitate your app accessing the data of users, without the digi.me app, however we leave that choice up to the user. This feature is known as Guest Consent or One Time Private Sharing. It is effecively the digi.me onboarding process, within a web browser. 

At the end of this process, the callback URL which you passed in will be called. If the user gave their consent, you will now be able to request user data.

-----

[Back to Index](../README.md)
