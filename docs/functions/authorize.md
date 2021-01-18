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

# authorize
This object contains methods that allow applications to obtain consent to access or write to their user's digi.me.

There are a few functions available in this object:
* [`authorize.exchangeCodeForToken()`](#authorizeexchangecodefortoken)
* [`authorize.once.getCreatePostboxUrl()`](#authorizeoncegetcreatepostboxUrl)
* [`authorize.once.getPrivateShareConsentUrl()`](#authorizeoncegetprivateshareconsenturl)
* [`authorize.once.getPrivateShareAsGuestUrl`](#authorizeoncegetprivateShareasguesturl)
* [`authorize.ongoing.getCreatePostboxUrl()`](#authorizeongoinggetcreatepostboxurl)
* [`authorize.ongoing.getPrivateShareConsentUrl()`](#authorizeongoinggetprivateshareconsentUrl)

## authorize.exchangeCodeForToken
Using a code verifier and an authorization code, exchange an access token to the user's digi.me which can be used to query or push data in the future.

#### Arguments
> [ExchangeCodeForTokenOptions](#ExchangeCodeForTokenOptions) 

#### Returns
> Promise<[UserAccessToken](#UserAccessToken)>

#### Example

```typescript
import digime from "@digime/digime-js-sdk";

const result = await digime.authorize.exchangeCodeForToken({
    applicationId: "test-application-id",
    contractId: "test-contract-id",
    privateKey: "pkcs1-private-key-string",
    redirectUri: "redirect-url-to-application",
    codeVerifier: "code-verifier-received-during-authorization",
    authorizationCode: "code-received-from-digime"
});

// => access token object
```

## authorize.once.getCreatePostboxUrl
Returns a deep link to digi.me that triggers a postbox creation request. Use this if you don't need ongoing write access. 

#### Arguments
> A [ConsentOnceOptions](#ConsentOnceOptions) object

#### Returns
> string: Deeplink to digime. 


#### Example
```typescript
import digime from "@digime/digime-js-sdk";

const result = digime.authorize.once.getCreatePostboxUrl({
    applicationId: "test-application-id",
    callbackUrl: "redirect-url-to-application",
    session: sessionObject,
});

// => result = "deeplink-to-digime"
```

## authorize.once.getPrivateShareConsentUrl
Returns a deep link to digi.me that triggers a consent request to share user data. Use this if you don't need ongoing access. 

#### Arguments
> A [ConsentOnceOptions](#ConsentOnceOptions) object

#### Returns
> string: Deeplink to digime. 

#### Example
```typescript
import digime from "@digime/digime-js-sdk";

const result = digime.authorize.once.getCreatePostboxUrl({
    applicationId: "test-application-id",
    callbackUrl: "redirect-url-to-application",
    session: sessionObject,
});

// => result = "deeplink-to-digime"
```

## authorize.once.getPrivateShareAsGuestUrl
Returns a link to digi.me guest onboarding that allows users to onboard data without using the digi.me appliation. 

#### Arguments
> a [ConsentOnceOptions](#ConsentOnceOptions) object

#### Returns
> string: The link to start the guest share flow

#### Example
```typescript
import digime from "@digime/digime-js-sdk";

const result = digime.authorize.once.getPrivateShareAsGuestUrl({
    callbackUrl: "redirect-url-to-application",
    session: sessionObject,
});

// => result = "link-to-private-share-as-guest"
```

## authorize.ongoing.getCreatePostboxUrl
Returns a deep link to digi.me that triggers a postbox creation request. Use this if you need ongoing write access. 

#### Arguments
> A [ConsentOngoingAccessOptions](#ConsentOngoingAccessOptions) object

#### Returns
> Promise<[GetAuthorizationUrlResponse](#GetAuthorizationUrlResponse)>

#### Example
```typescript
import digime from "@digime/digime-js-sdk";

const result = await digime.authorize.ongoing.getCreatePostboxUrl({
    applicationId: "test-application-id",
    contractId: "test-contract-id",
    privateKey: "pkcs1-private-key-string",
    redirectUri: "redirect-url-to-application",
    session: sessionObject,
    stat: "userID=1234"
});

// => result = {url: "deeplink-to-digime", codeVerifier: "code-verifier"}
```

## authorize.ongoing.getPrivateShareConsentUrl
Returns a deep link to digi.me that triggers a consent request to share user data. Use this if you need ongoing access. 

#### Arguments
> [ConsentOngoingAccessOptions](#ConsentOngoingAccessOptions) object

#### Returns
> Promise<[GetAuthorizationUrlResponse](#GetAuthorizationUrlResponse)>


#### Example

```typescript
import digime from "@digime/digime-js-sdk";

const result = await digime.authorize.ongoing.getPrivateShareConsentUrl({
    applicationId: "test-application-id",
    contractId: "test-contract-id",
    privateKey: "pkcs1-private-key-string",
    redirectUri: "redirect-url-to-application",
    session: sessionObject,
    stat: "userID=1234"
});

// => result = {url: "deeplink-to-digime", codeVerifier: "code-verifier"}
```

## authorize.ongoing.getCreatePostboxUrl
Returns a deep link to digi.me that triggers a postbox creation request. Use this if you need ongoing postbox access. 

#### Arguments
> [ConsentOngoingAccessOptions](#ConsentOngoingAccessOptions) object

#### Returns
> Promise<[GetAuthorizationUrlResponse](#GetAuthorizationUrlResponse)>


#### Example

```typescript
import digime from "@digime/digime-js-sdk";

const result = await digime.authorize.ongoing.getCreatePostboxUrl({
    applicationId: "test-application-id",
    contractId: "test-contract-id",
    privateKey: "pkcs1-private-key-string",
    redirectUri: "redirect-url-to-application",
    session: sessionObject,
    stat: "userID=1234"
});

// => result = {url: "deeplink-to-digime", codeVerifier: "code-verifier"}
```

# Types

## ConsentOnceOptions
```
interface ConsentOnceOptions {
    callbackUrl?: any;
    session: Session;
    applicationId: string;
}
```

| Parameter | Required | Description | Type |
|-|-|-|-|
| `applicationId` | Yes | The ID of your application as provided from digi.me. | string |
| `callbackUrl` | Yes | The return URL to your application once users have consented to your request in their digi.me application. | string |
| `session` | Yes | The session object which you received when you first established a session with digi.me. | Session |

## GetAuthorizationUrlResponse
```typescript
interface GetAuthorizationUrlResponse {
    url: string;
    codeVerifier: string;
}
```
| Parameter |  Description | Type |
|-|-|-|
| `url` |  Deeplink URL to the digi.me application. | string |
| `codeVerifier` |  The code verifier that was created in the preauthorization process. | string |


## ConsentOngoingAccessOptions
```typescript
interface ConsentOngoingAccessOptions {
    applicationId: string;
    contractId: string;
    privateKey: string;
    redirectUri: string;
    session: Session;
    state?: string;
}
```
| Parameter | Required | Description | Type |
|-|-|-|-|
| `applicationId` | Yes | The ID of your application as provided from digi.me. | string |
| `contractId` | Yes | The ID of your contract as provided from digi.me. | string |
| `privateKey` | Yes | A PKCS1 private key that is provided from digi.me for this contract. | string |
| `redirectUri` | Yes | The return URL to your application once users have consented to your request in their digi.me application. This Uri must match the one whitelisted in your contract. | string |
| `session` | Yes | The session object which you received when you first established a session with digi.me. | Session |
| `state` | No | Extra information you want to be passed back to you when the redirectUri is invoked. Any information your app needs to identify the user can be set here. | string |

## ExchangeCodeForTokenOptions
```typescript
interface ExchangeCodeForTokenOptions {
    applicationId: string;
    contractId: string;
    privateKey: string;
    redirectUri: string;
    codeVerifier: string;
    authorizationCode: string,
}
```
| Parameter | Required | Description | Type |
|-|-|-|-|
| `applicationId` | Yes | The ID of your application as provided from digi.me. | string |
| `contractId` | Yes | The ID of your contract as provided from digi.me. | string |
| `privateKey` | Yes | A PKCS1 private key that is provided from digi.me for this contract. | string |
| `redirectUri` | Yes | The return URL to your application once users have consented to your request in their digi.me application. | string |
| `codeVerifier` | Yes | Code Verifier used in the initial authorization process. | string |
| `authorizationCode` | Yes | Authorization Code received from the digi.me client. | string |

-----

[Back to Index](../README.md)
