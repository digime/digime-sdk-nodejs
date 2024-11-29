---
title: Delete Account
---

# Delete Account

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

Account IDs can be used from the list of all user accounts that can be fetched using [readAccounts](read-accounts.md).

Click [here](../interfaces/Types.DeleteAccountResponse.html) to check response that will be returned from deleteAccount call.
