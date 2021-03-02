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

# Requesting Ongoing Consent

Ongoing Access allows continuous access to user's data without the use of digi.me app **after** initial consent has been given.

From developer perspective the authorization process is almost identical to one off authorization. Under the hood we use OAuth 2.0 with JWT and JWS with RSA signing and verification to issue a medium lived, refreshable OAuth token, which is used to re-query user's data without the need to leave your app.

Here is a simplified sequence diagram of how the OAuth flow is implemented:
![](https://securedownloads.digi.me/partners/digime/OngoingAccess.png)

*The SDK handles all of this for you.*

## Authorize Step by Step

### Step 1 - Call `authorize.ongoing.getPrivateShareConsentUrl()`
The [authorize.ongoing.getPrivateShareConsentUrl()](#AuthorizeOngoingAccess) method is used for authorization for the first time you access the user's data or if you need to obtain a new user access token for this user. 

### Step 2 - Trigger call to digi.me
The result of this call is an [GetAuthorizationUrlResponse](#GetAuthorizationUrlResponse) object, in which you will find two extra pieces of information: 
`url` will give you the deep link to call to launch the consent process in the user's digi.me application.
`codeVerifier` is a string you need to persist and use after the user has given consent to exchange for an access token.

### Step 3 - Trigger digi.me for consent request
Once you call the deep link provided in step 2, the digi.me application will open and start the consent process. If everything is successful, the URL which you provided in Step One will be called. With this call, a few extra parameters are also added by the digi.me application:
`result`: result of the consent. Possible values are `SUCCESS`, `ERROR` or `CANCEL`
`code`: A code we can use to exchange for a user access token.
`state`: Any value you used in Step 1 is now passed back to you should you need to identify the user.

### Step 4 - Exchange for a user access token
Once we've received a code from the user consent, we can call `authorization.exchangeCodeForToken()` to exchange this with an access token. To do this, we will also need the code verifier which we received in Step 2.

The access token can be persisted for future use if we want to access data for this user again in the future. The access token will expire however, in which case, the user will need to consent the request using the digi.me application again.

[Back to Private Share Overview](./pull-data-overview.md)
[Back to Postbox Overview](./push-data-overview.md)
