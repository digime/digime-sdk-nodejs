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

# Requesting User Data

To request user data, you'll need to have [created a session](./establish-session.md) and asked for [user's consent](./fetch-user-consent.md). Please see the appropriate sections on how to do these.


## getSessionData
Once the user has given consent, we can now call `getSessionData` to receive user data. This function polls digi.me until we have received all the data the user has that satisfies the contract. `getSessionData` will return a promise which will resolve when all the files are fetched and a function which you can trigger to stop the data fetch process for whatever reason. 
```typescript
getSessionData = (
    sessionKey: string,
    privateKey: NodeRSA.Key,
    onFileData: FileSuccessHandler,
    onFileError: FileErrorHandler
): GetSessionDataResponse;
```
> Returns [GetSessionDataResponse](#GetSessionDataResponse)

`sessionKey`: string

Session ID received when we first established as session

`privateKey`: NodeRSA.Key

Private key in PKCS1 format which can be used to decrypt user's data. This is related to the contract, so you would need this when you receive the contract Id from digi.me.

`onFileData`: [FileSuccessHandler](#FileSuccessHandler)

This callback function is triggered whenever we have received data from the server. The content is passed back in files, so this function will be triggered whenever we have received data from one file. The callback will be triggered with an object in the parameter. The object has the following properties:

`onFileError`: [FileErrorHandler](#FileErrorHandler)

This callback function is triggered whenever we have failed to receive any data for the data file. By default, we try to fetch the data five times with exponential backoff before invoking the error callback. You can configure the retry options when you initiate the SDK. 

#### Exceptions
[ParameterValidationError](./handling-errors.md)

[FileDecryptionError](./handling-errors.md)

## getFileList
This call is part of the `getSessionData` above, but if you would like to have more control of the flow, you can call this method to see what files are available to download from the user.

```typescript
getFileList = (
    sessionKey: string,
): GetSessionDataResponse;
```

`sessionKey`: string

Session ID received when we first established as session

## getFile
This call is part of the `getSessionData` above, but if you would like to have more control of the flow, you can call this method to download a specific file from the user.

```typescript
getFile = (
    sessionKey: string,
    fileName: string,
    privateKey: NodeRSA.Key,
): GetSessionDataResponse;
```

`sessionKey`: string

Session ID received when we first established as session

`fileName`: string

File ID of the file you wish to download

`privateKey`: NodeRSA.Key

Private key in PKCS1 format which can be used to decrypt user's data. This is related to the contract, so you would need this when you receive the contract Id from digi.me.


## GetSessionDataResponse
This is what you'll receive when you call `getSessionData()`
```typescript
interface GetSessionDataResponse = {
    stopPolling: () => void;
    filePromise: Promise;
}
```

`stopPolling`: function

A function which stops the polling when you've called `getSessionData()`. This is used to prematurely stop the data fetching before all the user data has been received.

`filePromise`: Promise

A promise that will resolve once all user files have been processed.


## FileSuccessHandler
This is the callback that is triggered whenever we've received data from a user. This function will be called once everytime we've fetched a user file. This may be called multiple times per file if the file has been updated since last time we fetched.
```typescript
type FileSuccessHandler = ({
    fileData: any,
    fileDescriptor: FileDescriptor,
    fileName: string,
    fileList: string[],
}): void;
```
`fileData`: string

JSON string of data objects

`fileDescriptor`: [FileDescriptor](#FileDescriptor)

Object describing data that is returned

`fileName`: string

The filename which the objects reside in

`fileList`: string[]

The list of all files that are to be returned


## FileDescriptor
```typescript
interface FileDescriptor {
    objectCount: number;
    objectType: string;
    serviceGroup: string;
    serviceName: string;
}
```

`objectCount`: number

How many data objects are returned in this file.

`objectType`: string

What data these objects represent. E.g. Media
For a full list, please check out our [Reference Objects](http://developers.digi.me/reference-objects) guide on our developer docs.

`serviceGroup`: string

What service group the data belongs to. E.g. Social.
For a full list, please check out our [Reference Objects](http://developers.digi.me/reference-objects) guide on our developer docs.

`serviceName`: string

What service the data came from. E.g. Facebook.
For a full list, please check out our [Reference Objects](http://developers.digi.me/reference-objects) guide on our developer docs.


## FileErrorHandler
The error callback will be triggered whenever we encounter a problem with downloading a user file. This callback will contain an object in the parameter. The object has the following properties:
```typescript
type FileErrorHandler = ({
    error: Error,
    fileName: string,
    fileList: string[],
}): void;
```

`error`: Error

Object containing the error

`fileName`: string

The filename which the objects reside in

`fileList`: string[]

The list of all files that are to be returned

-----

[Back to Index](./README.md)
