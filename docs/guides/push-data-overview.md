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

# Postbox Overview - Step by step guide

In digi.me, we allow you to push data to end users using Postbox. A postbox is a temporary secure storage that only you and your user can access.


On this page, we will learn how to push data to your users using the digi.me Postbox. To create a postbox, the user needs to have the native digi.me application installed. 

## 1. Obtaining your Contract ID, Application ID & Private Key
To access the digi.me platform, you need to obtain an application ID for your application. You can get yours by filling out the registration form.

In order to push user data, you will also need a contract ID from digi.me support.

## 2. Establish a session
To start requesting or pushing data, you will first need to [establish a session](../functions/establish-session.md).

## 3. Create a Postbox
A postbox is a temporary secure storage that only you and your user can access. In order to push data, we will also need to [create a postbox](./create-postbox.md) for the user. To create a postbox, the user needs to have the native digi.me application installed.

## 4. Push Data
Once we have the postbox created, we are ready to [push data](./push-data.md) to the user!

Once data is pushed to the user, you can also request data back from them.

-----

[Back to Index](../README.md)
