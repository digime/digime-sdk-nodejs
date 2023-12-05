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

Reauthorization is needed if user receives error during reading of data similar to this:

```typescript
{
  "1_1xxxxxxxxx": {
    "state": "partial",
    "error": {
      "code": "ServiceAuthorizationError",
      "error": {
        "message": "Service authorization required",
        "reauth": true
      },
      "statusCode": 511
    }
  }
}
```

This error is shown if account marked with accountId `1_1xxxxxxxxx` in above example lost authorization rights for 3rd party service.

Account ids can also be used from the list of all user accounts that can be fetched using [readAccounts](./read-accounts.html).

To trigger account reauthorization you need to do the following:
```typescript
// Initialize the SDK
import { init } from "@digime/digime-sdk-nodejs";

const sdk = init({ applicationId: <you-application-id> });

const contractDetails = {
    contractId: <your-contract-id>,
    privateKey: <private-key-for-contract-id>,
}

// callback - The URL to call after reauthorization is done.
// contractDetails - The same one used in getAuthorizeUrl().
// accountId - accountId returned in error from above example
// userAccessToken - The user access token from the authorization step.

const { url } = await sdk.getReauthorizeAccountUrl({
    callback,
    contractDetails,
    accountId,
    userAccessToken,
});

```

The `url` returned might look something like this:

```
https://api.digi.me/apps/saas/reauthorize?code=<code>&accountRef=<accountRef>
```

Redirect the user to this URL and they will be asked to give permissions to 3rd party service.

At the end of the process, the `callback` provided above will be called with the follow extra query parameters:

| Parameter | Description | Returned Always |
|-|-|-|
| `success` | Whether the call was successful. `true` or `false` | Yes |
| `errorCode` | If there was an error, an error code will be returned. Please see the error code section for a list of possible errors. | Yes |
