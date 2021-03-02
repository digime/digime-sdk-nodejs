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

# Private Share Overview - Step by step guide

Requesting user data using digi.me is easy! On this page, we will learn how to receive data from your users using the digi.me Private Share platform.

## 1. Obtaining your Contract ID, Application ID & Private Key
To access the digi.me platform, you need to obtain an application ID for your application. You can get yours by filling out the [registration form](https://go.digi.me/developers/register).

In order to request user data, you will also need a contract ID from digi.me support.

## 2. Establish a session
To start requesting or pushing data, you will need to establish a session. See [Establish Session](../functions/establish-session.md) for more details on configuration options available when establishing a session.

## 3. Authorization
The digi.me authorization flow enables websites or applications (consumers) to access protected resources via the digi.me Public API (service provider), without requiring users to disclose their digi.me credentials to the consumers.

Depending on whether you have a contract that allows a one off request or an ongoing request, you can [request a one off consent](./requesting-one-off-consent.md) or an [ongoing consent](./requesting-ongoing-consent.md).

If your user had previously consented to ongoing access and you already have an access token for this user you can skip this step and continue to step 4.

## 4. Receive User Data
Now that you have been authorized for the user's data, you can [request user data](./session-data.md).

-----

[Back to Index](../README.md)
