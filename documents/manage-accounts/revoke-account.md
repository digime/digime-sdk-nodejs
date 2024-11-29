---
title: Revoke Account
---

# Revoke Account

<b>Important note: This option is supported only for MedMij.</b>

With long-term permissions introduced in MedMij, users must be given the option to revoke permissions.

To get the revoke URL, please do the following:

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
// redirectUri - Url you will be redirected to after revoke process is done

const { location } = await sdk.getRevokeAccountPermissionUrl({
    contractDetails,
    userAccessToken,
    accountId,
    redirectUri,
});

```

Account IDs can be used from the list of all user accounts that can be fetched using [readAccounts](read-accounts.md).

Click [here](../interfaces/Types.GetRevokeAccountPermissionUrlResponse.html) to check response that will be returned from `getRevokeAccountPermissionUrl` call.

Redirect the user to `location` returned in above response and they will have the possibility to adjust consent and withdraw it.

At the end of the process user will be redirected back to the `redirectUri` provided above. This url can contain following extra query parameters:

| Parameter       | Description                                            | Returned Always |
| --------------- | ------------------------------------------------------ | --------------- |
| `result`        | Whether the call was successful. `success` or `failed` | Yes             |
| `error_message` | If there was an error, an error code will be returned. | No              |
