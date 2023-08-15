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

Use this guide to push data to your user's library in digi.me.

Push to provider type is currently only supported for Medmij and is a bit different approach on how this data is pushed. We will explain this below.

In order to access the digi.me platform, you need to obtain an application ID, a contract for writing data and its private key.

Please check out [Getting Started](./start.html) for more details.

## 1. Onboarding and Authorization
Before we can push data to user, we need go through the authorization flow and obtain a user access token.

*If you already have an user access token for this user for another contract, you will still need to go through this process. Make sure to include any user access tokens you already have so we can link to the same library.*

### Getting an authorization URL and a code verifier
Start this process by getting the authorization URL by calling `getAuthorizeUrl`:

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

NOTE: Please have in mind that sourceType needs to be set to push only if you want to push data to provider. Currently this is only supported for Medmij. If sourceType is set to push we will show only services that are eligible for push to provider flow. 

### Redirect the user

From the step above, you will have received a URL to which you can redirect your users to to start the authorization process.
Don't forget to also store the code verifier against this user as you'll need it later!

An authorization URL should look something like:

```
https://api.digi.me/apps/saas/authorize?code=<code>
```

### Redirect back to your application

After the user has onboarded and finished with the authorization, the `callback` provided will be called.

An example URL might be:

```
https://your-website.com/return?success=true&code=<authorization-code>&state=<state-passed-in-from-before>&postboxId=<postbox-id>&publicKey=<public-key>&accountReference=<accountReference>
```

<small>*(`postboxId` and `publicKey` are only used with SDK versions lower than v9.x.x)*</small>


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

If you want to use push to provide (currently only Medmij) flow here is an example of puhs to provider call:

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

If you've written data to the user, you can read it back out using the [same process for reading user data](./read-data-overview.html). You will need a new contract which reads out raw data, so please contact digi.me [here](https://digi.me/register) to get yours.

Note: Reading data is not possible for push to provider flow.

Make sure you pass in the user access token which you obtained in step 3 above when authorizing the new contract.
