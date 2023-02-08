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

Before data can be read, we should already have a user access token for this user.

If not, you'll need to [authorize them](./authorize.html) first.


## Getting a Read Session
To start reading user data, we first need to obtain a session:

```typescript
// initialize the SDK
import { init } from "@digime/digime-sdk-nodejs";
const sdk = init({ applicationId });

// contractDetails - The same one used in getAuthorizeUrl().
// userAccessToken - The user access token from the authorization step.
// sessionOptions - (Optional) An limits or scopes to set for this session.

const { session, updatedAccessToken }  = await sdk.readSession({
    contractDetails,
    userAccessToken,
});
```

The [session](../../interfaces/Types.Session.html) received can now be used to query data.

## Reading accounts
Using the session received above, we can trigger readAccounts to read all user accounts.


```typescript
// ... initialize the SDK
// session - The session we received from readSession().
// privateKey - private key of your contract.
// contractId - Your contract id
// userAccessToken - The user access token from the authorization step.

const data = await sdk.readAccounts({
    sessionKey: session.key,
    privateKey,
    contractId,
    userAccessToken,
});
```

Received [response](../../types/Types.ReadAccountsResponse.html) should be something like:

```
{
  "accounts": [
    {
      "id": "1_serviceid",
      "name": "Service 1",
      "service": {
        "logo": "LogoUrl",
        "name": "Service Name"
      }
    },
    {
      "id": "2_serviceid",
      "name": "Service 2",
      "service": {
        "logo": "LogoUrl",
        "name": "Service Name"
      }
    }
  ],
  "consentid": ""
}
```
