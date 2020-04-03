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

## Introduction

The digi.me private sharing platform empowers developers to make use of user data from thousands of sources in a way that fully respects a user's privacy, and whilst conforming to GDPR. Our consent driven solution allows you to define exactly what terms you want data by, and the user to see these completely transparently, allowing them to make an informed choice as to whether to grant consent or not.

This SDK is a server side Node library that allows seamless authentication with the digi.me private sharing service written for JavaScript/TypeScript.

## Requirements

### Development
- Node 10.16 or above
- (Optional, if using TypeScript) TypeScript 3.8 or above

## Installation

Using npm:
```shell
$ npm i @digime/digime-js-sdk
```

## Example Application
You can check out an [example application](https://github.com/digime/digime-js-sdk-example) which uses the Digi.me SDK.

## Getting Started - 5 Simple Steps!

We have taken the most common use case for the digi.me Private Sharing SDK and compiled a quick start guide, which you can find below. Nonetheless, we recommend you [explore the documentation further](/docs/README.md).

This example will show you how to configure the SDK, and get you up and running with **retrieving user data**.

### 1. Obtaining your Contract ID, Application ID & Private Key:

To access the digi.me platform, you need to obtain an `AppID` for your application. You can get yours by filling out the registration form [here](https://go.digi.me/developers/register).

In a production environment, you will also be required to obtain your own `Contract ID` and `Private Key` from digi.me support. However, for demo purposes, we provide example values. You can find example keys in our [example application](https://github.com/digime/digime-js-sdk-example).

### 2. Starting out

By default, the SDK exports functions that have been pre-configured with out production environment. You can import them directly from the module:

```typescript
import { establishSession } from "@digime/digime-js-sdk";
```

Should you need to alter the defaults, you can do so manually. See [Initialise SDK](/docs/initialise-sdk.md) for more details.

### 3. Establishing a session
To start requesting or pushing data, you will need to establish a session:

```typescript
import { establishSession } from "@digime/digime-js-sdk";

const session = establishSession("YOUR_APP_ID", "YOUR_CONTRACT_ID");
```
See [Establish Session](/docs/establish-session.md) for more details on configuration options available when establishing a session.

### 4. Requesting Consent

In digi.me we provide two different ways to prompt user for consent

1. **Existing users who already have the digi.me application installed**

    Use the `getAuthorizeUrl` function to get a URL which can be used to trigger the digi.me client to open on their desktop, Android or iOS devices.

    ```typescript

    import { establishSession, getAuthorizeUrl } from "@digime/digime-js-sdk";

    const session = establishSession("YOUR_APP_ID", "YOUR_CONTRACT_ID");
    const redirectUrl = getAuthorizeUrl("YOUR_APP_ID", session, "YOUR_CALLBACK_URL");

    ```

    With the provided session, the client will know the details of the contract and ask for the user's permission on only the data the contract needs.

    The `callbackUrl` you pass in will be the URL the digi.me client will call once the user has given consent.

2. **Guest consent**

    This is a demo feature which allows the user to consent and onboard to digi.me using the browser. To trigger this onboard mode, you can call the `getGuestAuthorizeUrl` method to get a URL which when opened will ask user for consent.

    ```typescript
     import { establishSession, getGuestAuthorizeUrl } from "@digime/digime-js-sdk";

    const session = establishSession("YOUR_APP_ID", "YOUR_CONTRACT_ID");
    const redirectUrl = getGuestAuthorizeUrl(session, "YOUR_CALLBACK_URL");
    ```

Regardless of which mode above you trigger, the `callbackUrl` will be triggered once the user has authorised the consent. The callbackUrl will be triggered with a new param `result` where the value will either be `SUCCESS`, `ERROR` or `CANCEL`.

### 5. Fetching Data
Upon user consent you can now request user's files. To fetch all available data for your contract you can call `getSessionData` to start your data fetch. You'll need to provide us with a private key with which the SDK will try and decrypt user data. The private key is linked to the contract which you would have received when you obtained the contract ID. In addition you can pass callbacks `onFileData` and `onFileError` which will be triggered whenever a user data file is processed or if the fetch errored out.

This function will return an object containing a promise and which will resolve when all the files are fetched and a function which you can trigger to stop the data fetch process.
```typescript
import { getSessionData } from "@digime/digime-js-sdk";

// Triggered when an individual file is retrieved
const fileReceivedHandler = () => console.log("File received");

// Triggered on file error
const fileErrorHandler = () => console.log("File error");

// Start fetching data
const getSessionDataObject = getSessionData(
    SESSION_ID, // Session ID for your transaction
    YOUR_PRIVATE_KEY, // Private key for your contract
    fileReceivedHandler,
    fileErrorHandler
);

// No more data to process
getSessionDataObject.filePromise.then(() => {
    console.log("Data complete");
});
```

See [here](/docs/session-data.md) for more details

## Contributions

digi.me prides itself in offering our SDKs completely open source, under the [Apache 2.0 Licence](LICENSE); we welcome contributions from all developers.

We ask that when contributing, you ensure your changes meet our [contribution guidelines](CONTRIBUTING.md) before submitting a pull request.

## Further Reading

The topics discussed under Quick Start are just a small part of the power digi.me Private Sharing gives to data consumers such as yourself. We highly encourage you to explore the [full documentation](/docs/README.md) for more in-depth examples and guides, as well as troubleshooting advice and showcases of the capabilities on offer.

Additionally, there are a number of [example apps](https://github.com/digime/digime-js-sdk-example) built on digi.me. Feel free to have a look at those to get an insight into the power of Private Sharing.
