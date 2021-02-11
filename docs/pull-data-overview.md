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

# Requesting User Data Overview

Requesting user data using digi.me is easy! 

There's currently two methods: 

### OPTION 1: One Time Private Share
Use this method if you need one off access to user's data

#### How to use
Once you have your application ID, contract ID and the private key, you can follow the below steps to start the process.

1. [Create a session with digi.me](./establish-session.md)

2. [Ask for user consent](./fetch-user-consent.md)

3. [Request user data](./session-data.md)

### OPTION 2:  Ongoing Private Sharing
Ongoing Access allows continuous access to user's data without the use of digi.me app **after** initial consent has been given.

From developer perspective the authorization process is almost identical to one off authorization. Under the hood we use OAuth 2.0 with JWT and JWS with RSA signing and verification to issue a medium lived, refreshable OAuth token, which is used to re-query user's data without the need to leave your app.

Here is a simplified sequence diagram of how the OAuth flow is implemented:
![](https://securedownloads.digi.me/partners/digime/OngoingAccess.png)

*The SDK handles all of this for you.*

Use this method if you need regular access to user's data and you are using an ongoing contract.

#### How to use
Once you have your application ID, contract ID and the private key, you can follow the below steps to start the process.

1. [Create a session with digi.me](./establish-session.md)

2. [Ask for user consent](./ongoing-authorization.md)

3. [Request user data](./session-data.md)


-----

[Back to Index](./README.md)
