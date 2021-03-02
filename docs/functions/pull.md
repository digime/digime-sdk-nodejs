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

# pull
This object contains methods that allow applications to query user data.

## pull.prepareFilesUsingAccessToken
If you already have an access token, you can call this function to prepare user data for sharing

#### Argument

> [PrepareFilesUsingAccessTokenOptions ](#PrepareFilesUsingAccessTokenOptions)

#### Returns

> Promise<[UserLibraryAccessResponse](#UserLibraryAccessResponse)>

#### Example

```typescript
import digime from "@digime/digime-js-sdk";

const result = await digime.pull.prepareFilesUsingAccessToken({
    applicationId: "test-application-id",
    contractId: "test-contract-id",
    privateKey: "pkcs1-private-key-string",
    redirectUri: "redirect-url-to-application",
    userAccessToken: <user-access-token>
    session: <current-session-object>
});

// result => {success: "true|false"} (A new access token may also be returned if the current one has expired.)
```

## pull.getFileList
Using your authorized session, you can retrieve a list of files available to you from the user using this function.

#### Argument
> [GetFileListOptions](#GetFileListOptions)

#### Returns
> Promise [CAFileListResponse](#CAFileListResponse)

#### Example

```typescript
import digime from "@digime/digime-js-sdk";

const result = await digime.pull.getFileList({
    sessionKey: <current-session-key>
});

// => Result will contain the file list in user library as well as their status.
```

## pull.getSessionAccounts

Using your authorized session, we can use this function to query about accounts in user's digi.me. This will return all accounts that the user has in their digi.me, which will contain service names, account identifiers and logos (if applicable).

#### Argument
> [UserDataAccessOptions](#UserDataAccessOptions)

#### Returns
> Promise [GetSessionAccountsResponse](#GetSessionAccountsResponse)

#### Example

```typescript
import digime from "@digime/digime-js-sdk";

const result = await digime.pull.getSessionAccounts({
    privateKey: "pkcs1-private-key-string",
    sessionKey: <current-session-key>
});

// => Result will contain all accounts that the user has in their digi.me, which will contain service names, account identifiers and logos.
```

## pull.getSessionData

Using your authorized session, we can call getSessionData to receive user data. This function polls digi.me until we have received all the data the user has that satisfies the contract. `getSessionData` will return a promise which will resolve when all the files are fetched and a function which you can trigger to stop the data fetch process for whatever reason.

#### Argument
> [GetSessionDataOptions](#GetSessionDataOptions)

#### Returns
> Promise [GetSessionDataResponse](#GetSessionDataResponse)

```typescript
import digime from "@digime/digime-js-sdk";

const result = await digime.pull.getSessionData({
    sessionKey: <current-session-key>
    privateKey: <private-key-in-pkcs1-format>,
    onFileData: ({fileData, fileName, fileMetadata, fileList}) => {
        // Do something with data received.
    },
    onFileError: ({fileName, error}) => {
        // Handle any errors received.
    }
});

// => Result will contain the file list in user library as well as their status.
```

NOTE: The type of fileMetadata that is returned depends on the type of data it is. If it is a file pushed to user's digi.me via Postbox, it will be of type `RawFileMetadata`. Else it will be of type `MappedFileMetadata`.

On data success, the call back function will be called with the buffer of the data file. In order to turn the budder into objects

```
// To turn data buffer from digi.me into objects.
const onFileData = ({fileData, fileName, fileMetadata, fileList}) => {
    const data = JSON.parse(fileData.toString("utf8"));
    // Do something with data received.
}
```

```
// If it's something pushed up via postbox, you can see what the data type is via its mimetype
const onFileData = ({fileData, fileName, fileMetadata, fileList}) => {
    if (fileMetadata.mimetype === "image/jpg") {
        const image = fileData.toString("base64");
        // Do something with the image
    }
}

```

# Types

## AccountDetails
| Property | Description | Type |
|-|-|-|
| `state` | Current status of the account. | [LibraryStatus](#librarystatus) |
| `error` | Optional. Details of any error with this account. | [Error](#error) |

## CAFileListResponse
| Property | Description | Data type |
|-|-|-|
| `status` | The current sync status of the user library. | [LibraryDetail](#librarydetail) |
| `fileList` | The current list of files in the user library. | [FileDetail](#filedetail)[] |

## FileSuccessResult
This is the callback that is triggered whenever we've received data from a user. This function will be called once everytime we've fetched a user file. This may be called multiple times per file if the file has been updated since last time we fetched.
| Response item | Description | Data type |
|-|-|-|
| `fileData` | A Buffer object of the data requested. | Buffer |
| `fileName` | The name of the file. | string |
| `fileMetadata` | An object describing the file returned | [MappedFileMetadata](#mappedfilemetadata) | [RawFileMetadata](#rawfilemetadata) |
| `fileList` | The current list of files in the user library. | [FileDetail](#filedetail)[] |

## FileErrorResult 
This is the callback that is triggered whenever we've received data from a user. This function will be called once everytime we've fetched a user file. This may be called multiple times per file if the file has been updated since last time we fetched.
| Response item | Description | Data type |
|-|-|-|
| `error` | Object containing the error. | Error |
| `fileName` | The name of the file. | string |
| `fileList` | The current list of files in the user library. | [FileDetail](#filedetail)[] |

## MappedFileMetadata
```
interface MappedFileMetadata {
    objectCount: number;
    objectType: string;
    serviceGroup: string;
    serviceName: string;
}
```
| Property | Description | Data type |
|-|-|-|
| `objectCount` | How many data objects are returned in this file. | number |
| `objectType` | What data these objects represent. E.g. Media For a full list, please check out our [Reference Objects guide](https://developers.digi.me/reference-objects) on our developer docs. | string |
| `serviceGroup` | What service group the data belongs to. E.g. Social. For a full list, please check out our [Reference Objects guide](https://developers.digi.me/reference-objects) on our developer docs. | string |
| `serviceName` | What service the data came from. E.g. Facebook. For a full list, please check out our [Reference Objects guide](https://developers.digi.me/reference-objects) on our developer docs. | string |

## PrepareFilesUsingAccessTokenOptions
```
interface PrepareFilesUsingAccessTokenOptions {
    applicationId: string;
    contractId: string;
    privateKey: NodeRSA.Key;
    redirectUri: string;
    userAccessToken: UserAccessToken;
    session: Session;
}
```
| Parameter | Required | Description | Type |
|-|-|-|-|
| `applicationId` | Yes | The ID of your application as provided from digi.me. | string |
| `contractId` | Yes | The ID of your contract as provided from digi.me. | string |
| `privateKey` | Yes | A PKCS1 private key that is provided from digi.me for this contract. | string |
| `redirectUri` | Yes | The return URL to your application once users have consented to your request in their digi.me application. | string |
| `userAccessToken` | Yes | User Access Token for this user from previous authorization flow. | [UserAccessToken](#UserAccessToken) |
| `session` | Yes | The session object which you received when you first established a session with digi.me. | Session |


## RawFileMetadata
```
interface RawFileMetadata {
    mimetype: string;
    accounts: {
        accountid: string,
    }[];
    reference?: string[];
    tags?: string[];
}
```
| Property | Description | Data type |
|-|-|-|
| `mimetype` | How many data objects are returned in this file. | string |
| `accounts` | An array of account IDs that was pushed up with this file. | UserAccount[] |
| `tags` | Any tags linked to this file when it was pushed up. | string[] |
| `reference` | Any references linked to this file when it was pushed up. | string[] |

## GetSessionAccountsResponse
| Property | Description | Type |
|-|-|-|
| `accounts` | Current accounts in the user's digi.me. | [AccountDetails](#accountdetails)[] |

## GetSessionDataOptions
```
interface GetSessionDataOptions {
   sessionKey: string,
   privateKey: NodeRSA.Key,
   onFileData: (response: FileSuccessResult) => void,
   onFileError: (response: FileErrorResult) => void,
}
```
| Property | Description | Type |
|-|-|-|
| `sessionKey` | Session ID received when we first established a session. | string |
| `privateKey` | Private key in PKCS1 format which can be used to decrypt user's data. This is related to the contract, so you would need this when you receive the contract Id from digi.me. | NodeRSA.Key |
| `onFileData` | A function to call if you want to stop polling for user data before it is finished. | (response: [FileSuccessHandler](#FileSuccessHandler)) => void |
| `onFileError` | A Promise that will resolve once all available files have been processed. | (response: [FileErrorHandler](#FileErrorHandler)) => void |

## GetSessionDataResponse
```
interface GetSessionDataResponse {
    stopPolling: () => void;
    filePromise: Promise<any>;
}
```
| Property | Description | Type |
|-|-|-|
| `stopPolling` | A function to call if you want to stop polling for user data before it is finished. | Function |
| `filePromise` | A Promise that will resolve once all available files have been processed. | Promise |

## GetFileListOptions
```
interface GetFileListOptions {
    sessionKey: string;
}
```
| Parameter | Required | Description | Type |
|-|-|-|-|
| `sessionKey` | Yes | The session key is a string that binds your contract and your application ID and it is what you'll need to pass up to digi.me whenever you make a call. | string |

## LibraryDetail
| Property | Description | Type |
|-|-|-|
| `state` | Current status of the library. | [LibraryStatus](#librarystatus) |
| `details` | Details of each account in user library. | [AccountDetails](#accountdetails) |

## LibraryStatus
| Value | Description |
|-|-|      
| `pending` | Request is pending user permission. |
| `running` | User permission granted. Sync is running in the library. Some files may be available and new files may be added to the library. |
| `completed` | Syncs have completed. No new files will be added to the list and all files (if any) are published in files list at this point. |
| `partial` | (Some of) Dependent sync(s) failed or timed out. Some files may be available. No new files will be added to the files list at this point. |

## UserDataAccessOptions
```typescript
interface UserDataAccessOptions {
    privateKey: string;
    sessionKey: string;
}
```

| Parameter | Required | Description | Type |
|-|-|-|-|
| `privateKey` | Yes | A PKCS1 private key that is provided from digi.me for this contract. | string |
| `sessionKey` | Yes | The session key is a string that binds your contract and your application ID and it is what you'll need to pass up to digi.me whenever you make a call. | string |

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
