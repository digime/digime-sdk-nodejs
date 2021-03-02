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

# push
This object contains methods that allow applications to push data into user's Postbox.

## push.pushDataToPostbox
If you already have an access token, you can call this function to prepare user data for sharing

#### Argument

> [PushDataToPostboxOptions](#PushDataToPostboxOptions)

#### Returns

> Promise<[PushDataToPostboxResponse](#PushDataToPostboxResponse)>

#### Exceptions
> [TypeValidationError](./handling-errors.md)

#### Example

```typescript
import digime from "@digime/digime-js-sdk";

const result = await digime.push.pushDataToPostbox({
    applicationId: "test-application-id",
    contractId: "test-contract-id",
    privateKey: "pkcs1-private-key-string",
    publicKey: "pkcs1-public-key-string",
    redirectUri: "redirect-url-to-application",
    userAccessToken: "user-access-token",
    sessionKey: "current-session-key",
    data: {
        fileData: fileInBufferFormat,
        fileName: "user-profile-pic.png",
        fileDescriptor: {
            mimeType: "image/png",
            tags: ["profilepic"],
            accounts: [{ accountId: "user1"}],
        }
    }
});

// result => {status: "delivered|pending", expires: <seconds-untiil-data-in-postbox-expires>} (A new access token may also be returned if the current one has expired.)
```

## push.getPostboxImportUrl
This function returns a deeplink to the digi.me application, so that you can direct your users to import any data from their Postbox to their digi.me.

#### Argument

> none

#### Returns

> string

```typescript
import digime from "@digime/digime-js-sdk";

const result = await digime.push.getPostboxImportUrl();

// result => "deeplink-to-digi.me"
```

# Types

## PushDataToPostboxOptions

```typescript
interface PushDataToPostboxOptions {
    applicationId: string;
    contractId: string;
    data: PushedFileMeta;
    postboxId: string;
    privateKey: string;
    publicKey: string;
    redirectUri: string;
    sessionKey: string;
    userAccessToken?: UserAccessToken;
}
```
| Parameter | Required | Description | Type |
|-|-|-|-|
| `applicationId` | Yes | The ID of your application as provided from digi.me. | string |
| `contractId` | Yes | The ID of your contract as provided from digi.me. | string |
| `privateKey` | Yes | A PKCS1 private key that is provided from digi.me for this contract. | string |
| `data` | Yes | A PKCS1 public key that was provided from the digime application after the postbox was created.| [PushedFileMeta](#PushedFileMeta) |
| `publicKey` | Yes | A PKCS1 public key that was provided from the digime application after the postbox was created.| string |
| `redirectUri` | Yes | The whitelisted redirect Uri linked to your contract. | string |
| `sessionKey` | Yes | A valid session key. | string |
| `userAccessToken` | No | An access token to the user's digi.me. If this is provided, we will push data to the user's digi.me straight away. If this is not provided, then the user will import data from their postbox next time they log in to digi.me. | [UserAccessToken](#UserAccessToken) |

## PushDataToPostboxResponse

```typescript
interface PushDataToPostboxResponse {
    expires: number;
    status: PushDataStatus;
    updatedAccessToken?: UserAccessToken;
}
```

| Parameter | Required | Description | Type |
|-|-|-|-|
| `expires` | Yes | Seconds until the posted data expires. | string |
| `status` | Yes | Delivery status of the posted data. `delivered` - The data has been pushed into user's digi.me `pending` - The data has been pushed into user's postbox, and will be imported into user's digi'me next time they log in. | string |
| `updatedAccessToken` | No | If a user access token was provided and it has expired, an updated token may be returned if refresh was successful. | [UserAccessToken](#UserAccessToken) |

## PushedFileMeta 

```typescript
interface PushedFileMeta {
    fileData: Buffer;
    fileName: string;
    fileDescriptor: {
        mimeType: string;
        accounts: Array<{
            accountId: string;
        }>;
        reference?: string[];
        tags?: string[];
    };
}
```

| Parameter | Required | Description | Type |
|-|-|-|-|
| `accountId` | Yes | Account ID of the user in your system. Currently this is a required field for all data to be pushed in. | string |
| `accounts` | Yes | An array of account objects used to identify the user in your system. | object[] |
| `fileData` | Yes | A Buffer of the data that is to be pushed into the user's postbox. | Buffer |
| `fileDescriptor` | Yes | Information regarding the data pushed. | FileMeta |
| `fileName` | Yes | Name of the file to be attached. | string |
| `mimeType` | Yes | MimeType of the file that has been pushed in. | string |
| `tags` | No | Any tags you might want to attach with the file. Used when you want to retrieve it again. | string[] |

## UserAccessToken

```typescript
interface UserAccessToken {
    accessToken: string;
    refreshToken: string;
    expiry: number;
}
```

| Parameter | Required | Description | Type |
|-|-|-|-|
| `access_token` | The access token that can be used to request user data. | number |
| `expiry` | The time stamp shows what time the access token will expire. In seconds. | number |
| `refresh_token` | A refresh token that can be used to retrieve a new access token once the current one expires. | string |

-----

[Back to Index](../README.md)
