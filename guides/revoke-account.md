Important note: Option suported only for Medmij.

With long-term permissions introduced in MedMij user must be given option to revoke permissions.

To get revoke url please do following:

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
Account ids can be used from the list of all user accounts that can be fetched using [readAccounts](./read-accounts.html).

Click [here](../../interfaces/Types.GetRevokeAccountPermissionUrlResponse.html) to check response that will be returned from `getRevokeAccountPermissionUrl` call.

The `location` returned might look something like this:

Redirect the user to this URL and they will have the possibility to adjust consent and withdraw it. 

At the end of the process, the `location` provided above can contain following extra query parameters:

| Parameter | Description | Returned Always |
|-|-|-|
| `result` | Whether the call was successful. `success` or `failed` | Yes |
| `error_message` | If there was an error, an error code will be returned. | No |