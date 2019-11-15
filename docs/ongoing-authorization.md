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

# Getting User Consent

Before we fetch data from the user, we will need to ask our users for their consent. For ongoing access, we will issue a medium lived, refreshable OAuth token, which is used to re-query user's data without the need to leave your app.

\* *`refreshTokens` used to refresh `accessTokens` do eventually expire (for example - 30 days). When this happens, user will be directed back to digi.me app for re-authorization.*

## Authorize Step by Step

### Step 1 - Call `authorizeOngoingAccess()`
The [authorizeOngoingAccess()](#AuthorizeOngoingAccess) method is used for authorization for the first time you access the user's data or for subsequent access. Whether you can access user data will depend on what is passed in, and the result of the authorization.

### Step 2 - Handle authorization result
The result of this call is an [authorizeOngoingAccessResponse()](#AuthorizeOngoingAccessResponse) object. The first property to check is the `dataAuthorized` boolean. Depending on what is returned, you can do one of two things. 

If the value is true, you can skip the below steps and continue straight to [fetch user data](./session-data.md). The [response object](#AuthorizeOngoingAccessResponse) will also return the updated `UserAccessToken` which you can store and reuse next time you want to fetch data from the same user.

If it's false (as it should be when it's the user's first time), we will need to trigger the digi.me application to ask for user approval. 

In the return object, you will find two extra pieces of information: 
`authorizationUrl` will give you the deep link to call to launch the consent process in the user's digi.me application.
`codeVerifier` is a string you need to persist and use after the user has given consent to exchange for an access token.

### Step 3 - Trigger digi.me for consent request
Once you call the deep link provided in step 2, the digi.me application will open and start the consent process. If everything is successful, the URL which you provided in Step One will be called. With this call, a few extra parameters are also added by the digi.me application:
`result`: result of the consent. Possible values are `SUCCESS`, `ERROR` or `CANCEL`
`message`: if the result was an `ERROR` we also return an error message.
`sessionKey`: Session key of the consent
`code`: A code we can use to exchange for a user access token.
`state`: Any value you used in Step 1 is now passed back to you should you need to identify the user.

### Step 4 - Exchange for a user access token
Once we've received a code from the user consent, we can call `exchangeCodeForToken()` to exchange this with an access token. To do this, we will also need the code verifier which we received in Step 1. The access token can be persisted for future use if we want to access data for this user again in the future. The access token will expire however, in which case, the user will need to consent the request using the digi.me application again.

### Subsequent requests
If we already have an access token for the user, we can start at step 1 again, but passing the user token into the [authorizeOngoingAccess()](#AuthorizeOngoingAccess) method. If the request is successful, you can go directly to [fetch user data](./session-data.md)

## authorizeOngoingAccess

```typescript
const authorizeOngoingAccess = async (
    details: OngoingAccessAuthorization,
    session: Session,
): string;
```
> Returns an `AuthorizeOngoingAccessResponse` object

`details`: [OngoingAccessAuthorization](#OngoingAccessAuthorization)

Details needed to initiate an ongoing access to your user's data

`session`: Session

The session object which you received when you first established a session with digi.me

## OngoingAccessAuthorization
This is an object that is passed to the `authorizeOngoingAccess()` with important details about the authorization.

```typescript
// OngoingAccessAuthorization object for initial authorization
{
    applicationId: string;
    contractId: string;
    privateKey: NodeRSA.Key;
    redirectUri: string;
    accessToken?: UserAccessToken;
    state?: string;
}
```

`applicationId`: string

The ID of your application as provided from digi.me.

`contractId`: string

The ID of your contract as provided from digi.me.

`privateKey`: NodeRSA.Key

A PKCS1 private key that is provided from digi.me for this contract.

`redirectUri`: string

The return URL to your application once users have consented to your request in their digi.me application

`accessToken`: UserAccessToken (Optional)
If you've already got an access token for this user from previous data requests, then pass this in when authorizing. For first time users, this field should be left empty.

`state`: string (Optional)
Extra information you want to be passed back to you when the redirectUri is invoked. Any information your app needs to identify the user can be set here.

## AuthorizeOngoingAccessResponse
```typescript
// AuthorizeOngoingAccessResponse object after initial authorization
{
    dataAuthorized: boolean;
    updatedAccessToken?: UserAccessToken;
    authorizationUrl?: string;
    codeVerifier?: string;
}
```

`dataAuthorized`: string

If user data is ready to be fetched.

`updatedAccessToken`: string

If the authorization was successful, we will return the successful token we used. We could have refreshed it for you!

`authorizationUrl`: string

If data is not authorized, this field will be populated with a deep link you can trigger to launch the digi.me application to ask the user for their consent.

`codeVerifier`: string

If the data is not authorized, this field with be populated with a code verifier. that you'll need to persist. Combine with the code the digi.me application passes back, we can exchange it for a user token


[Back to Index](./README.md)
