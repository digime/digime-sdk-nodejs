Use this guide to push data to your user's library in digi.me.

Currently, the "push to provider" functionality is only supported for MedMij, and it follows a slightly different approach for how data is pushed. We will explain this below.

To access the digi.me platform, you need an application ID, a contract for writing data, and its private key.

For more details, please check [Getting Started](./start.html).

## 1. Onboarding and Authorization
Before pushing data to a user, you must go through the authorization flow and obtain a user access token.

*If you already have a user access token for this user from another contract, you will still need to go through this process. Be sure to include any existing user access tokens so we can link them to the same library.*

### Getting an authorization URL and a code verifier
Begin the process by obtaining the authorization URL by calling `getAuthorizeUrl`:

```typescript
import { init } from "@digime/digime-sdk-nodejs";

const sdk = init({ applicationId });

const contractDetails = {
    contractId: <your-contract-id>,
    privateKey: <private-key-for-contract-id>,
}

const { url, codeVerifier } = await sdk.getAuthorizeUrl({
    contractDetails,
    callback: <an-url-to-call-when-authorization-is-done>,
    serviceId: toNumber(serviceId),
    state: <any-details-to-help-you-identify-user-on-return>,
    userAccessToken: <if-you-already-have-one>
    sourceType: <optional-use-only-for-push-to-provider-flow>
});

// Store the codeVerifier against the current user, and redirect them to the url returned.
// This will kick start the authorization process.
```

NOTE: Please keep in mind that sourceType needs to be set to push only if you intend to push data to a provider. Currently, this is only supported for Medmij. If sourceType is set to push, only services eligible for the push-to-provider flow will be displayed.

### Redirect the user

From the previous step, you will have received a URL to which you can redirect your users to begin the authorization process. Don't forget to store the code verifier associated with this user, as you'll need it later!

An authorization URL should look something like this:

```
https://api.digi.me/apps/saas/authorize?code=<code>
```

### Redirect back to your application

After the user has onboarded and finished with the authorization, the `callback` provided will be called.

An example URL might be:

```
https://your-website.com/return?success=true&code=<authorization-code>&state=<state-passed-in-from-before>&accountReference=<accountReference>
```

## 2. Exchange for an User Access Token
The `code` returned in step 2 above can be used with the `codeVerifier` to exchange for a user access token. This allows you to request updated data from this user in the future for as long as the user access token is valid. Read more about the user access token [here](../fundamentals/access-token.html).

```typescript
// ... initialize the SDK

// authorizationCode - The code returned in the query parameter of the returned URL.
// codeVerifier - The one stored from step 2.
// contractDetails - The same one used in getAuthorizeUrl().

const userAccessToken = await sdk.exchangeCodeForToken({
    codeVerifier,
    authorizationCode,
    contractDetails,
});

// Store the userAccessToken against the current user. We can use this for future reads.
```

## 3. Push Data
Once you have the `userAccessToken` from the steps above, we can push data!

Please take a look at push data to find out more about how to format the data to push.

```typescript
// ... initialize the SDK

// contractDetails - The same one used in getAuthorizeUrl().
// userAccessToken - The user access token from the authorization step.
// data - An object containing the buffer of the file to upload and some meta data.
// onAccessTokenChange - A function that will be called when AccessToken is changed.

await sdk.pushData({
    contractDetails,
    userAccessToken,
    data: {
        fileData: req.file.buffer,
        fileName: req.file.originalname,
        fileDescriptor: JSON.parse(fileMeta),
    },
    onAccessTokenChange(response) {
        // Add logic to save new access token
    },
});
```

If you want to use the push-to-provider flow (currently only supported for Medmij), here is an example:

```typescript
// ... initialize the SDK

// sourceType - (Optional) Use push to filter out only services that are used for push to provider type. Default SourceType is set to pull.
// contractDetails - The same one used in getAuthorizeUrl().
// userAccessToken - The user access token from the authorization step.
// data - Medmij accepted object (type Record<string, unknown>).
// onAccessTokenChange - A function that will be called when AccessToken is changed.
// version - Currently supported versions are "stu3" and "3.0.2".
// standard - Supported standard is fhir
// accountId - accountId can be found in readAccounts API and can be filterd out with accountReference that will be returned to you as explained in authorization process.

await sdk.pushData({
    push: "provider",
    version: "stu3",
    contractDetails,
    userAccessToken,
    data: {}, // only medmij data object is acceptable
    onAccessTokenChange(response) {
        // Add logic to save new access token
    },
    accountId,
});
```

If we need to push more files to the users in the future, we can keep pushing as long as the user access token is valid.

## 4. Reading files back out

If you've written data to the user, you can read it back out using the [same process for reading user data](./read-data-overview.html). You will need a new contract which reads out raw data, so please contact digi.me [here](https://worlddataexchange.com/register) to get yours.

Note: Reading data is not possible for push to provider flow.

Make sure you pass in the user access token which you obtained in step 3 above when authorizing the new contract.
