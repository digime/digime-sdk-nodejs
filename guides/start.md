
<p>
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
</p>

## Requirements

- Node 18.0 or above
- (Optional, if using TypeScript) TypeScript 4.0 or above

## Installation

Using npm:
```shell
$ npm i @digime/digime-sdk-nodejs
```

## Obtaining your Contract ID, Application ID & Private Key
To access the digi.me platform, you need to obtain an AppID for your application. You can get yours by filling out the registration form [here](https://worlddataexchange.com/register).

In a production environment, you will also need to obtain your own Contract ID and Private Key from digi.me support. However, for demo purposes, we provide example values. You can find these example keys in our [example application](https://github.com/digime/digime-sdk-nodejs-example).

## Initializing the SDK
Once you have the above information, you can initiate the SDK.

```typescript
import { init } from "@digime/digime-sdk-nodejs";

const digimeSDK = init({ applicationId: <my-unique-application-id> });
```

To see all the other options for initializing the SDK, please take a look [here](../fundamentals/initialise-sdk.html).

## Using the SDK
* Use digi.me to [read data from your users](read-data-overview.html).
* Use digi.me to [push data to your users](push-data-overview.html).
* To see all the available functions in the SDK, please take a look [here](../../interfaces/SDK.DigimeSDK.html).
