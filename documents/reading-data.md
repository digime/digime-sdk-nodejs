---
title: Read Data
children:
    - file-metadata.md
---

# Read Data

Before data can be read, you must already have a user access token for this user.

If not, you will need to [authorize them](create-user/authorizing.md) first and ask them to [onboard any extra services](manage-accounts/onboarding-additional-sources.md) to provide the data you are requesting.

## Getting a Read Session

To start reading user data, we first need to obtain a session:

```typescript
// initialize the SDK
import { init } from "@digime/digime-sdk-nodejs";
const sdk = init({ applicationId });

// contractDetails - The same one used in getAuthorizeUrl().
// userAccessToken - The user access token from the authorization step.
// sessionOptions - (Optional) An limits or scopes to set for this session.

const { session, updatedAccessToken } = await sdk.readSession({
    contractDetails,
    userAccessToken,
});
```

The {@link Types.Session | session} received can now be used to query data.

More information on the limits and scoping of the raw and mapped data interface can be found {@link Types.PullSessionOptions | here}.

## Reading All Files

Using the session received above, we can trigger the {@link SDK.DigimeSDK#readAllFiles | readAllFiles} method to read all available files from this user.

```typescript
// ... initialize the SDK

// session - The session we received from readSession().
// privateKey - The private key for this contract.
// contractId - Your contract id
// userAccessToken - The user access token from the authorization step.
// onFileData - A function that will be called when a file is successfully downloaded.
// onFileError - A function that will be called when an error occurs when downloading a file.
// onStatusChange - A function that will be called when file list status is changed.
// onAccessTokenChange - A function that will be called when AccessToken is changed.

const { stopPolling, filePromise } = await sdk.readAllFiles({
    sessionKey: session.key,
    privateKey: <private-key-of-contract>,
    contractId: <your-contract-id>,
    userAccessToken,
    onFileData: ({fileData, fileName, fileMetadata}) => {
        // This is where you deal with any data you receive from digi.me,
        const data = JSON.parse(fileData.toString("utf8"));
        console.log("Retrieved: ", fileName);
        console.log("Metadata:\n", JSON.stringify(fileMetadata, null, 2));
        console.log("Content:\n", JSON.stringify(data, null, 2));
    },
    onFileError: ({fileName, error}) => {
        console.log(`Error retrieving file ${fileName}: ${error.toString()}`);
    },
    onStatusChange(response) {
        console.log("File list status changed: ", response);
    },
    onAccessTokenChange(response) {
        // Add logic to save new access token
    },
});

// filePromise is a promise that will resolve when data fetching is complete.
// stopPolling is a function that you can call if you would like to stop the process when it's still running.
```

The type of FileMetadata that is returned depends on the type of data it is. Please see [here](file-metadata.md) for more information.

## Selecting Files

If you'd like more control over the downloading of the files, we can call {@link SDK.DigimeSDK#readFileList | readFileList} to see all available files from this user:

```typescript
// ... initialize the SDK
// session - The session we received from readSession().

const response = await sdk.readFileList({ sessionKey: session.key });
```

{@link Types.ReadFileListResponse | Response} among other props contains a `fileList` and `status` of each user service onboarded.

You can then download the files manually using {@link SDK.DigimeSDK#readFile | readFile()}.

```typescript
// ... initialize the SDK
// session - The session we received from readSession().
// fileName - The file object from getFileList() that you want to download.
// privateKey - private key of your contract.
// contractId - Your contract id
// userAccessToken - The user access token from the authorization step.

const data = await sdk.readFile({
    sessionKey: session.key,
    fileName: file.name,
    privateKey,
    contractId,
    userAccessToken,
});
```

If you want to download just file metadata please use similar approach with method {@link SDK.DigimeSDK#readFileMetadata | readFileMetadata()}.

Note that readAllFiles is helper method that uses readFileList and readFile methods to return entire data set and also help user maintain latest access token and file list status. If readFileList and readFile methods are used please add logic to maintain latest access token since both of these method will try to do refresh of token automatically.
