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

In order to push or read data from the user's digi.me, we will need an user access token to their digi.me.
Once we have this, we can read up to date data of the services the user has onboarded to their digi.me.

User access tokens are obtained once a user successfully goes through a [authorization process](../fundamentals/authorize.html).

Separate user access tokens are required for each contract, so it is possible to have multiple for one user if you require to read and push data.

## Access Token Expiry

The access token will eventually expire. When you first created it, a timestamp (Unix Epoch Time) at which it will expire will be returned. The SDK will attempt to refresh it automatically when you use it next. If a refresh is needed, it will return the new access token to you.

If the refresh is unsuccessful, you'll need to go through the authorization process again with the user.

Note that methods for reading data will also try to do auto refresh, so please add logic for keep this latest tokek that is returned back from SDK.

## Refresh Token

SDK methods have option to do token auto refresh and will do that as explained in respective methods, but
if token is expired or close to expire there is an option to issue new token manually and be able to control that process internally.

Access token can be issued manually by calling refreshToken method as explained below:

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

const { newToken } = await sdk.refreshToken({
    contractDetails,
    userAccessToken,
});

```

If refresh token expired you should see error similar to `The token (refresh_token) is invalid`. In this case please check please check [getReauthorizeUrl](./reauthorize.html) method.
