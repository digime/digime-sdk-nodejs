In order to push or read data from a user's digi.me account, we will need a user access token for their digi.me account.
Once we have this, we can access up-to-date data from the sources the user has onboarded to their digi.me.

User access tokens are obtained after a user successfully completes the [authorization process](../fundamentals/authorize.html).

Separate user access tokens are required for each contract, so it is possible to have multiple tokens for one user if you need to read and push data.

## Access Token Expiry

The access token will eventually expire. When it is first created, a timestamp (Unix Epoch Time) indicating when it will expire is returned. The SDK will attempt to refresh the token automatically when it is used again. If a refresh is needed, the new access token will be returned to you.

If the refresh is unsuccessful, you'll need to go through [reauthorization process](../fundamentals/reauthorize.html).

Please note that methods for reading data will also attempt auto-refresh, so ensure that you have logic to store the latest token returned by the SDK.

## Refresh Token

SDK methods have an option for automatic token refresh, as explained in the respective methods. However, if the token has expired or is close to expiring, there is an option to manually issue a new token and control the process internally.

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
