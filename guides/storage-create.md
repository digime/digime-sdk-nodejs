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

The SDK Provides a functions that you can use to create cloud storage. Storage can be used as an independed storage not related to user. For creation of provisional storage you should use SDK method createProvisionalStorage.

#### Examples
The most basic initialization:

```
// Initialize the SDK
import {init} from "@digime/digime-sdk-nodejs";
const sdk = init({ applicationId: <you-application-id> });


// contractDetails - The same one passed into getAuthorizeUrl().

const contractDetails = {
    contractId: <your-contract-id>,
    privateKey: <private-key-for-contract-id>,
}

const storage = await sdk.createProvisionalStorage({
    contractDetails,
});

```

This method creates provisional storage and returns:

```
storage: {
    id: string;
    kid: string;
};

```

Storage id returned in above response will be used for uploading items to storage as well as for geting them from storage.

Provisional storage can be connected later with user when calling [getAuthorizeUrl()](../authorize.html) method by passing in storageId.

SDK also supports getting storage id for existing user. This can be done by calling:

```
// contractDetails - The same one used in getAuthorizeUrl().
// userAccessToken - The user access token from the authorization step.

const storage = await sdk.getUserStorage({
    contractDetails,
    userAccessToken,
});
```

This method will return:

```
    storage: {
        id: string;
        kid: string;
    };
    userAccessToken?: UserAccessToken;
```

Please note that above method will do auto refresh of userAccessToken so it is needed to add logic to save new userAccessToken.
