---
title: Create Storage
---

# Create Storage

To create provisional storage, you should use the SDK method `createProvisionalStorage`

## Examples

The most basic initialization:

```
// Initialize the SDK
import {init} from "@worlddataexchange/digime-sdk-nodejs";
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

The storage ID returned in the above response will be used for uploading items to storage as well as for retrieving them from storage..

Provisional storage can later be connected to a user when calling the [getAuthorizeUrl()](../create-user/authorizing.md) method by passing in the storageId.

The SDK also supports retrieving the storage ID for an existing user. This can be done by calling:

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

Please note that the above method will automatically refresh the userAccessToken, so it is necessary to add logic to save the new userAccessToken.
