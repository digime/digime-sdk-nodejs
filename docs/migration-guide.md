![](https://securedownloads.digi.me/partners/digime/SDKReadmeBanner.png)
<p align="center">
    <a href="https://developers.digi.me/slack/join">
        <img src="https://img.shields.io/badge/chat-slack-blueviolet.svg" alt="Developer Chat">
    </a>
    <a href="../LICENSE">
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

# v1.0 Migration Guide

This guide is for users who have been using pre v1.0 versions of the SDK, and are hoping to use the latest SDK. There's been a few changes and hopefully this guide will help you migrate across.

## Configurations
SDK configurations have changed. Instead of `host`, the property to set is now `baseUrl` which will need to include the protocol. If you had previous set `host` to `api.digi.me` for example, you'll now need to set `baseUrl` to `https://api.digi.me`.

The retry options have also changed, please see the [interface](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/got/index.d.ts#L267) for more details.

## Functions
Some calls have been renamed:

`createSDK` -> `init`

`getDataForSession` -> `getSessionData` - Please see [Import Data](./import-data.md) for more details.

`getAppURL` -> `getAuthorizeUrl`

`getWebURL` -> `getGuestAuthorizeUrl`

`getPostboxURL` -> `getCreatePostboxUrl`

`getPushCompleteURL` -> `getPostboxImportUrl`

-----

[Back to Index](./README.md)
