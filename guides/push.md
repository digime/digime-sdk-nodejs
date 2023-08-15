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

Before we can be push data to the user, we should already have a user access token for this user.

If not, you'll need to [authorize them](./authorize.html) first. Make sure the user access token is for a [write contract](../fundamentals/contracts.html).

Once you have authorized a write contract, you should have the `userAccessToken` for this user.

```typescript
// ... initialize the SDK

// type - Push type can be library or provider. Library is common case to use when you need to push data to your library. Provider type is used for pushing to 3rd party source.
// contractDetails - The same one used in getAuthorizeUrl().
// userAccessToken - The user access token from the authorization step.
// data - An object containing the buffer of the file to upload and some meta data. If type is provider then Record<string, unknown> type is expected.
// onAccessTokenChange - A function that will be called when AccessToken is changed.
// version - Can be "stu3" or  "3.0.2" and it is used only for provider type.
// standard -  For now only can be set to "fhir" and it is used only for provider type.
// accountId - Id of account where push needs to be submited. Only for provider type. List of accounts where account Id can be found is related to readAccounts method. Callback URL after authorization will also return accountReference that can be used to match exact account object where push needs to be submited.

await sdk.pushData({
    type: "library",
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
If the promise resolves successfully, the data has been written to the user's digi.me.

## FileMeta
This is how you should format the `data` property for library type:

```typescript
interface FileMeta {
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
| `fileData` | Yes | A Buffer of the data that is to be pushed into the user's library. | Buffer |
| `fileDescriptor` | Yes | Information regarding the data pushed. | FileDescriptor |
| `fileName` | Yes | Name of the file to be attached. | string |

## FileDescriptor
| Parameter | Required | Description | Type |
|-|-|-|-|
| `accountId` | Yes | Account ID of the user in your system. Currently this is a required field for all data to be pushed in. | string |
| `accounts` | Yes | An array of account objects used to identify the user in your system. | object[] |
| `mimeType` | Yes | MimeType of the file that has been pushed in. | string |
| `tags` | No | Any tags you might want to attach with the file. Used when you want to retrieve it again. | string[] |
