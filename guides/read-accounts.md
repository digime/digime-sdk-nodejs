Before data can be read accounts, you must already have a user access token for that user.

If you do not have one, you will need to [authorize](./authorize.html) first.

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
