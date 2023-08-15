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

## Reading accounts
Using the session received above, we can trigger readAccounts to read all user accounts.


```typescript
// ... initialize the SDK
// contractDetails - The same one used in getAuthorizeUrl().
// userAccessToken - The user access token from the authorization step.

const data = await sdk.readAccounts({
    contractDetails,
    userAccessToken,
});
```

Received [response](../../types/Types.ReadAccountsResponse.html) should be something like:

```
{
  "accounts": [
    {
      "createdDate": 1693931692826,
      "id": "40_XXXX",
      "providerFavIcon": "providerFavIconUrl",
      "providerLogo": "logoUrl",
      "reference": "xxxxxxxxxxx",
      "serviceGroupId": 1,
      "serviceGroupName": "Social",
      "serviceTypeId": 40,
      "serviceTypeName": "Instagram",
      "serviceTypeReference": "instagram",
      "sourceId": 420,
      "type": "USER",
      "updatedDate": 1693931704516
    },
    {
      "createdDate": 1693931692826,
      "id": "40_XXXX",
      "providerFavIcon": "providerFavIconUrl",
      "providerLogo": "logoUrl",
      "reference": "xxxxxxxxxxx",
      "serviceGroupId": 1,
      "serviceGroupName": "Social",
      "serviceTypeId": 1,
      "serviceTypeName": "Facebook",
      "serviceTypeReference": "facebook",
      "sourceId": 1,
      "type": "USER",
      "updatedDate": 1693931704516
    }
],
}
```
