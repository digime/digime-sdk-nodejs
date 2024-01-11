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

To delete account you need to do the following:

```typescript
// Initialize the SDK
import { init } from "@digime/digime-sdk-nodejs";

const sdk = init({ applicationId: <you-application-id> });

const contractDetails = {
    contractId: <your-contract-id>,
    privateKey: <private-key-for-contract-id>,
}

// contractDetails - The same one used in getAuthorizeUrl().
// userAccessToken - The user access token from the authorization step.
// accountId - Account Id

const { deleted } = await sdk.deleteAccount({
    contractDetails,
    userAccessToken,
    accountId,
});
```

Account ids can be used from the list of all user accounts that can be fetched using [readAccounts](./read-accounts.html).

Click [here](../../interfaces/Types.DeleteAccountResponse.html) to check response that will be returned from deleteAccount call.
