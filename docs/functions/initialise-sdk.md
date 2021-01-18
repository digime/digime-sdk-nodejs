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

# Initialising the SDK

In order to use the JS SDK, you'll first need to initialise it. By default, the SDK will point to the production environment of digi.me, but when initialising the SDK, you have the ability to override some default behaviour and specify some options.

The create SDK function has the following signature:

#### Argument
> [DMESDKConfiguration](#DMESDKConfiguration)

#### Returns
> [digimeSDK](#digimeSDK)

#### Exceptions
> [TypeValidationError](./handling-errors.md)

#### Examples
```typescript
import digime from "@digime/digime-js-sdk"

// => You can start using the sdk using default settings. 
// eg digime.establishSession()

// Custom settings
const digimeWithCustomSettings = digime.init({
    baseUrl: "custom-environment",
    retryOptions: <custom-retry-options>
});

// => You can start using the sdk using custom settings. 
// eg digimeWithCustomSettings.establishSession()

```

# Types

## digimeSDK
Once the SDK is initiated, you will find the following objects/functions at your disposal:

| Property | Description | 
|-|-|
| [establishSession](./functions/establish-session.md) | Used to create a session key with digi.me. |
| [authorize](./functions/authorize.md) | Used to authorize consent to either push or share private data. |
| [push](./functions/push.md) | An object containing functions useful in pushing data to user's digi.me. |
| [pull](./functions/pull.md) | An object containing functions used in fetching user's data. |
| [getReceiptUrl](./establish-session.md) | Returns a URL which presents a receipt in the native digi.me application. |


## DMESDKConfiguration
Options you can configure when initialising the SDK:
```typescript
interface DMESDKConfiguration {
    baseUrl: string;
    retryOptions: RetryOptions;
}
```

| Property | Required | Description | Type |
|-|-|-|-|
| `baseUrl` | Yes | Base URL to point to. By default it will use the production environment of digi.me. Unless specifically instructed, it is best to use this environment as it will be the most stable. Default: "https://api.digi.me/1.5". | string |
| `retryOptions` | No | Options to specify retry logic for failed API calls. By default we retry any failed API calls five times. | [RetryOptions](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/got/index.d.ts#L267) |

-----

[Back to Index](../README.md)
