---
title: Authorizing
---

# Authorizing

In order to push or read data from library, we first need to create a user access token for each user.
User access tokens are linked to a contract, and it is possible to create multiple tokens that have access to the same library.
Authorization is the process of obtaining a user access token for the user.

### When do we need to authorize?

Authorization is required in the following scenarios:

- For new users. During this process user will be asked to onboard first source/account.
- For an existing user working with a different contract. For example, if they have shared data and now you would like to push data into their library.

If you encounter the error `The token (refresh_token) is expired` please refer to the [getReauthorizeUrl](reauthorizing.md) method.

### What are the steps?

- Obtain an authorization URL and a code verifier.
- Redirect the user to the authorization URL.
- Exchange the result for a user access token.

## Getting a authorization URL and a code verifier

```typescript
import {init} from "@worlddataexchange/digime-sdk-nodejs";

const sdk = init({ applicationId: <you-application-id> });

const contractDetails = {
    contractId: <your-contract-id>,
    privateKey: <private-key-for-contract-id>,
}

// contractDetails - The same one passed into getAuthorizeUrl().
// callback - URL to be called after authorization is done.
// serviceId - (Optional) During authorization, we can also ask user to onboard a service. ID can be found from querySources()
// state - Put anything here to identify the user when authorization completes. This will be passed back in the callback.
// userAccessToken - (Optional) User access token you may already have for this user from another contract.
// sessionOptions - (Optional) An limits or scopes to set for this session.
// sourceType - (Optional) Use push to filter out only services that are used for push to provider type. Default SourceType is set to pull.
// sampleData - (Optional) Use for testing flow with sample datasets
// locale - (Optional) Send preferred locale for authorization client to be used. Default is en.
// includeSampleDataOnlySources - (Optional) Flag to indicate if we should include sample data only sources. Default is false.
// storageId - (Optional) Provide storage.id returned createProvisionalStorage to connect this storage to created user
// triggerQuery - (Optional) Flag to indicate if data query will be triggered post service authorisation. Default is true. If this is set to false data for added service will not be returned. You may want to set to false when adding multiple services subsequently and only get data for all services when adding last service.
// sourcesScope - (Optional) scope is currently used only for pasing data type.

const result = await sdk.getAuthorizeUrl({
    contractDetails,
    callback: <an-url-to-call-when-authorization-is-done>,
    state: <any-extra-info-to-identify-user>
    serviceId: toNumber(serviceId),
    userAccessToken: <access-token>,
    sessionOptions: <{
        pull: PullSessionOptions
    }>,
    sourceType: "pull",
    sampleData: SampleDataOptions,
    locale: "nl",
    includeSampleDataOnlySources: true,
    storageId: "some-storage-id",
    triggerQuery: true,
    sourcesScope: <options-to-scope-soruces-during-authorization-flow>
});

// => result will contain a url and a code verifier which you will need for later.
// Calling the url returned will trigger the authorization process.
```

More details on types that can be passed into getAuthorizeUrl please check {@link Types.GetAuthorizeUrlOptions | here}.

The {@link Types.GetAuthorizeUrlResponse | result} returned will include a `url`, `codeVerifier` and `session`.
Store the `codeVerifier` against this user as this will be required for later.

Store `session` as well for getting data after authorization process is done.

More on limits and scoping of raw and mapped data interface can be found {@link Types.PullSessionOptions | here}.

To test flow using sample data please check more details [here](../sample-datasets.md)

## Redirecting the user to this authorization URL

The URL returned is our authorization web onboard client, and will look something like this.

```
https://api.digi.me/apps/saas/authorize?code=<code>&service=<service-id>
```

Redirect the user to this URL, and they will be asked to onboard the service and consent to share the requested data.

On _success_, the `callback` provided above will be called with the follow extra query parameters:

| Parameter          | Description                                                                                                                                                                          | Returned Always |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------- |
| `success`          | Whether the call was successful. `true` or `false`                                                                                                                                   | Yes             |
| `state`            | The same string that was passed in to the `getAuthorizationUrl` call.                                                                                                                | Yes             |
| `code`             | Authorization Code. Only returned when the authorization successful.                                                                                                                 | Yes             |
| `accountReference` | This information can be used to get full account info when matching this number with reference number returned by readAccounts API. Only returned when the authorization successful. | Yes             |

On _failure_, the `callbackUrl` provided will be called with the follow extra query parameters:

| Parameter   | Description                                                                                                             | Returned Always |
| ----------- | ----------------------------------------------------------------------------------------------------------------------- | --------------- |
| `success`   | Whether the call was successful. `true` or `false`                                                                      | Yes             |
| `errorCode` | If there was an error, an error code will be returned. Please see the error code section for a list of possible errors. | Yes             |

## Exchanging the result for an user access token.

Once we have the `code` from a successful authorization, we can combine that with the `codeVerifier` to exchange a User Access Token.

```typescript
// ... initialize the SDK

// authorizationCode - The code returned in the query parameter of the returned URL.
// codeVerifier - The one returned from the result of getAuthorizeUrl().
// contractDetails - The same one passed into getAuthorizeUrl().

const userAccessToken = await sdk.exchangeCodeForToken({
    codeVerifier,
    authorizationCode,
    contractDetails,
});

// Store the userAccessToken against the current user. We can use this for future reads.
```

Once the above steps are completed, you will have an User Access Token for this user for this contract. You will be able to perform read/write tasks from their library.

Note that for the same user, if you'd like to authorize another contract, you'll need to provide the User Access Token when authorizing for the next contract.
