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

# Requesting User Data

To request user data, you'll need to have created a session and asked for user's consent. Please refer to the [private share overview](./pull-data-overview.md) on how to do these.

## Preparing User Data

If you have just received consent from the user, then the data has been prepared and you can simply use your session key to request user data.

If you had previously received an access token to the user's digi.me and would like to use it to request user data in a new session, you'll need to prepare the data first. 
You can do this by calling [pull.prepareFilesUsingAccessToken](../functions/pull.md#pullpreparefilesusingaccesstoken).

## Querying User Data.

To request a list of files available, check out [pull.getFileList](../functions/pull.md#pullgetfilelist).

To request a list of accounts in user's digi.me, check out [pull.getSessionAccounts](../functions/pull.md#pullgetsessionaccounts).

To request data files shared, check out [pull.getSessionData](../functions/pull.md#pullgetsessiondata).

-----

[Back to Index](../README.md)
