---
title: Reauthorizing
---

# Reauthorizing

If you are getting error `The token (refresh_token) is expired` you will need to call getReauthorizeUrl method:

### What are the steps?

- Getting a reauthorization URL and a code verifier from the `getReauthorizeUrl` method.
- Redirecting the user to the reauthorization URL received from the `getReauthorizeUrl` method.
- Exchanging the result for a fresh user access token..

## Getting a authorization URL and a code verifier

```typescript
import {init} from "@worlddataexchange/digime-sdk-nodejs";

const sdk = init({ applicationId: <you-application-id> });

const contractDetails = {
    contractId: <your-contract-id>,
    privateKey: <private-key-for-contract-id>,
}

// contractDetails - The same one passed into getReauthorizeUrl().
// callback - URL to be called after authorization is done.
// state - Put anything here to identify the user when authorization completes. This will be passed back in the callback.
// userAccessToken - (Optional) User access token you may already have for this user from another contract.
// sessionOptions - (Optional) An limits or scopes to set for this session.

const result = await sdk.getReauthorizeUrl({
    contractDetails,
    callback: <an-url-to-call-when-authorization-is-done>,
    state: <any-extra-info-to-identify-user>
    userAccessToken: <access-token>,
    sessionOptions: <{
        pull: PullSessionOptions
    }>,
});


// => result will contain a url, session and a code verifier which you will need for later.
// Calling the url returned will trigger the reauthorization process.
```

More details on types that can be passed into getReauthorizeUrl please check {@link Types.GetReauthorizeUrlOptions | here}.

The {@link Types.GetReauthorizeUrlResponse | result} returned will include a `url`, `codeVerifier` and `session`.
Store the `codeVerifier` against this user as this will be required for later.

Store `session` as well for getting data after reauthorization process is done.

## Redirecting the user to this reauthorization URL

The URL returned is the digi.me web onboard client, and will look something like this.

```
https://api.digi.me/apps/saas/user-reauth?code=<code>
```

Redirect the user to this URL, and we will attempt to reauthorize user, during this process for security reasons we might ask user to onboard one of users existing accounts. If user is inactive for too long we might ask be able to recover user and you will need to do authorization process from scratch.

On _success_, the `callback` provided above will be called with the follow extra query parameters:

| Parameter | Description                                                           | Returned Always |
| --------- | --------------------------------------------------------------------- | --------------- |
| `success` | Whether the call was successful. `true` or `false`                    | Yes             |
| `state`   | The same string that was passed in to the `getAuthorizationUrl` call. | Yes             |
| `code`    | Authorization Code. Only returned when the authorization successful.  | Yes             |

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
// codeVerifier - The one returned from the result of getReauthorizeUrl().
// contractDetails - The same one passed into getReauthorizeUrl().

const userAccessToken = await sdk.exchangeCodeForToken({
    codeVerifier,
    authorizationCode,
    contractDetails,
});

// Store the userAccessToken against the current user. We can use this for future reads.
```

Once the above steps are completed, you will have a User Access Token for this user associated with this contract. You will be able to perform read and write tasks from their library.

Please note that if you are using an invalid token, the `getReauthorizeUrl` method will return an InvalidToken error (The token (access_token) is invalid), and you will not be able to reauthorize this user.
