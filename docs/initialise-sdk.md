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
```typescript
const init = (sdkOptions?: Partial<DMESDKConfiguration>);
```
> Returns the configured SDK object

The SDK object contains the following functions:

* [establishSession](./establish-session.md) - Used to create a session key with digi.me

* [getSessionData](./session-data.md) - Used to fetch user data

* [getSessionAccounts](./session-accounts.md) - Used to fetch user accounts

* [pushDataToPostbox](./postbox.md) - Used to push data into user's digi.me via Postbox

* [getAuthorizeUrl](./fetch-user-consent.md) - Returns a URL which triggers a user consent using the native digi.me application

* [getGuestAuthorizeUrl](./fetch-user-consent.md) - Returns a URL which triggers a user consent via guest onboarding on the browser

* [getReceiptUrl](./establish-session.md) - Returns a URL which presents a receipt in the native digi.me application

* [getCreatePostboxUrl](./postbox.md) - Returns a URL which triggers a postbox creation using the native digi.me application

* [getPostboxImportUrl](./postbox.md) - Returns a URL which instructs the native digi.me application to import from Postbox.

`sdkOptions`: [DMESDKConfiguration](#DMESDKConfiguration)
Configuration that can be optionally passed in to override default SDK behaviours.

#### Exceptions
[TypeValidationError](./handling-errors.md)

### DMESDKConfiguration
Options you can configure when initialising the SDK:
```typescript
interface DMESDKConfiguration {
    baseUrl: string;
    retryOptions: RetryOptions;
}
```
`baseUrl`: string

Base URL to point to. By default it will use the production environment of digi.me. Unless specifically instructed, it is best to use this environment as it will be the most stable. Default: "https://api.digi.me/1.4"

`retryOptions`: [RetryOptions](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/got/index.d.ts#L267)

Options to specify retry logic for failed API calls. By default we retry any failed API calls five times.

-----

[Back to Index](./README.md)
