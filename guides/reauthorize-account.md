Reauthorization is needed if the user receives an error during data reading similar to this:

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

This error indicates that the account marked with accountId `1_1xxxxxxxxx` in the above example has lost authorization rights for a third-party source.

Account IDs can also be obtained from the list of all user accounts that can be fetched using [readAccounts](./read-accounts.html).

To trigger account reauthorization, you need to do the following:

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
// locale - (Optional) Send prefared locale for authorization client to be used. Default is en.

const { url } = await sdk.getReauthorizeAccountUrl({
    callback,
    contractDetails,
    accountId,
    userAccessToken,
    locale,
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
