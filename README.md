# Digi.me SDK for JavaScript/TypeScript
---
The Digi.me SDK for JavaScript/TypeScript is a Node library that allows seamless authentication with Consent Access service, making content requests and core decryption services. For details on the API and general CA architecture - visit [Dev Support Docs](https://developers.digi.me/consent-access.html)

## Prerequisite
In order to run the complete Consent Access process, the Digi.me SDK for JavaScript required the Digi.me app being installed on either an iOS or Android device to enable user authorization of requests. For detailed explanation of the Consent Acess architecture - visit [Dev Support Docs](https://developers.digi.me/consent-access.html)

## Requirements
- Node 8 or above

## Table of Contents

  * [Installation](#installation)
  * [Example Application](#example-application)
  * [SDK usage](#sdk-usage)

## Installation

Using npm:
```shell
$ npm i @digime/digime-js-sdk
```

## Example Application
You can check out an example application which uses the Digi.me SDK [here](https://github.com/digime/digime-js-sdk-example)

## SDK Usage
### Obtaining your Contract ID/App ID/Private Key

Before accessing the public APIs, a valid Contract ID needs to be registered for an App ID.
The Contract ID uniquely identifies a contract with the user that spells out what type of data you want, what you will and won't do with it, how long you will retain the data and whether you will implement the right to be forgotten.

Additionally it also specifies how the data is encrypted in transit.

A private key is needed to decrypt data that is passed back. Digi.me can provide you with a private ID.

To register a Consent Access contract check out [Digi.me Dev Support](https://developers.digi.me). There you can request a Contract ID and App ID to which it is bound.

### Configuring the SDK
When initialising the SDK, you have the ability to override the default behaviour and specify some options.
The create SDK function has the following signature:
```typescript
const createSDK = (sdkOptions?: Partial<DigiMeSDKConfiguration>);
```

##### DigiMeSDKConfiguration
Options you can configure when initialising the SDK:
```typescript
interface DigiMeSDKConfiguration {
    host: string;
    version: string;
    retryOptions: PartialAttemptOptions<any>;
}
```
`host`
Type: string
The environment of digi.me to point to. By default it will use the production environment of digi.me. Unless specifically instructed, it is best to use this environment as it will be the most stable. Default: "api.digi.me"

`version` Type: string
The version of the public api to point to. Default: "v1.0"

`retryOptions` Type: PartialAttemptOptions<any>
Options to specify retry logic for failed API calls

##### PartialAttemptOptions
Check out the class [here](https://github.com/lifeomic/attempt/blob/master/src/index.ts#L14-L27)

### Establishing a session
To start fetching data into your application, you will need to authorise a session.
The authorisation flow is separated into two phases:

Initialise a session with Digi.me API which returns a session object.
```typescript
establishSession = async (appId: string, contractId: string, scope: CAScope): Promise<Session>;
```
`appId` Type : string
Your application ID. You can request this from digi.me.

`contractId` Type : string
The ID of the contract which you want to make with the user. You can request this from digi.me.

`scope` Type : CAScope
Options to only return a subset of data the contract asks for. Default: {}

##### CAScope

```typescript
interface CAScope {
    timeRanges? : ITimeRange[];
}
```
`timeRanges`
Type: ITimeRange[]
Having timeRanges set will allow you to retrieve only a subset of data that the contract has asked for. This might come in handy if you already have data from the existing user and you might only want to retrieve any new data that might have been added to the user's library in the last x months. The format of ITimeRange is as follows:

##### ITimeRange

```typescript
interface ITimeRange {
    from?: number;
    last?: string;
    to?: number;
}
```

`from`
Type: number
This is the unix timestamp in seconds. If this is set, we will return data created after this timestamp.

`to`
Type: number
This is the unix timestamp in seconds. If this is set, we will return data created before this timestamp.

`last`
Type: string
You can set a dynamic time range based on the current date. The string is in the format of "{value}{unit}"
For units we currently accept:

'd' - day
'm' - month
'y' - year

For example to return data for the last six months : "6m"

### Getting User Consent
In digi.me we provide two different ways to prompt user for consent
1. Existing users who already have the digi.me application installed - Use the `getAppURL` method to get a URL which can be used to trigger the digi.me client to open on their Android or iOS devices. The callbackURL you pass in will be the URL the digi.me client will call once the user has accepted the data request. Given the session id, the client will know the details of the contract and ask for the user's permission on only the data the contract needs.
    ```typescript
    getAppURL = (appId: string, session: Session, callbackURL: string);
    ```

2. Guest consent - This is a demo feature which allows the user to consent and onboard to digi.me using the browser. To trigger this onboard mode, you can call the `getWebURL` method to get a URL which when opened will ask user for consent.
    ```typescript
    getWebURL = (session: Session, callbackURL: string, options: DigiMeSDKConfiguration);
    ```

Regardless of which mode above you've trigger, the callbackURL will be triggered once the user has authorised the consent. The callbackURL will be triggered with a new param `result` where the value will either be `DATA_READY` or `CANCELLED` if the user decided to deny the request.

### Fetching Data
Upon successful authorisation you can now request user's files. To fetch all available data for your contract you can call `getDataForSession` to start your data fetch. You'll need to provide us with a private key with which we will try and decrypt user data. In addition you can pass a onFileData and onFileError which will be triggered whenever a user data file is processed or if the fetch errored out.
```typescript
getDataForSession = async (
    sessionKey: string,
    privateKey: NodeRSA.Key,
    onFileData: FileSuccessHandler,
    onFileError: FileErrorHandler,
    options: DigiMeSDKConfiguration
): Promise<any>;
```

The `onFileData` callback function is triggered whenever we have received data from the server. The content is passed back in files, so this function will be triggered whenever we have received data from one file. The callback will be triggered with an object in the parameter. The object has the following properties:
    1. fileData - JSON string of data objects
    2. fileDescriptor - Object describing data that is returned
    3. fileName - the filename which the objects reside in
    4. fileList - the list of all files that are to be returned
```typescript
callback = ({
    fileData: any,
    fileDescriptor: IFileDescriptor,
    fileName: string,
    fileList: string[],
}): void;
```

#### IFileDescriptor
```typescript
interface IFileDescriptor {
    objectCount: number;
    objectType: string;
    serviceGroup: string;
    serviceName: string;
}
```

`objectCount`
Type: number
How many data objects are returned in this file.

`objectType`
Type: string
What data these objects represent. E.g. Media
For a full list, please check out our developer docs [here](http://developers.digi.me/reference-objects).

`serviceGroup`
Type: string
What service group the data belongs to. E.g. Social.
For a full list, please check out our developer docs [here](http://developers.digi.me/reference-objects).

`serviceName`
Type: string
What service the data came from. E.g. Facebook.
For a full list, please check out our developer docs [here](http://developers.digi.me/reference-objects).

The `onFileError` callback function is triggered whenever we have failed to receive any data for the data file. By default, we try to fetch the data five times with exponential backoff before invoking the error callback. The error callback will be triggered with an object in the parameter. The object has the following properties:
    1. error - error object
    2. fileName - the filename which the objects reside in
    3. fileList - the list of all files that are to be returned
```typescript
callback = ({
    error: Error,
    fileName: string,
    fileList: string[],
}): void;
```
