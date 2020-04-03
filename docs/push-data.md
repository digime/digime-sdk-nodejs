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

# Pushing data into Postbox

Once we have the [postbox created](./create-postbox.md), we are ready to push data to the user! In order to push data, we need the following: `sessionId`, `postboxId`, `publicKey`, and `pushedData`, which is an object encapculating the data and an object describing the data. You can use the `pushDataToPostbox` function to push this data.

## pushDataToPostbox

```typescript
const pushDataToPostbox = async (
    sessionId: string,
    postboxId: string,
    publicKey: string,
    pushedData: FileMeta
): Promise;
```
> Returns a promise which will resolve when data is pushed in to user postbox.

`sessionId`: string

Your Session ID. You can request this from digi.me.

`postboxId`: string

Postbox ID as received from step 1 above.

`publicKey`: string

Public key as received from step 1 above.

`pushedData`: [FileMeta](#FileMeta)

Data to be pushed in to user postbox.

#### Exceptions
[TypeValidationError](./handling-errors.md)

## FileMeta
```typescript
interface FileMeta {
    fileData: string;
    fileName: string;
    fileDescriptor: PushedFileMeta;
}
```

`fileData`

Type: string
A base64 encoded string of the data that is to be pushed into the user's postbox.

`fileName`

Type: string
Name of the file to be attached

`fileDescriptor`

Type: PushedFileMeta

## PushedFileMeta
```typescript
interface PushedFileMeta {
    mimeType: string;
    tags: string[];
    reference: string[];
    accounts: MetaAccount[];
}
```

`mimeType`

Type: string
MimeType of the file that has been pushed in

`tags`

Type: string[]
Any tags you might want to attach with the file. Used when you want to retrieve it again

`reference`

Type: string[]
Filename of the file being pushed up

`accounts`

Type: MetaAccount[]
An array of account objects used to identify the user in your system

##### MetaAccount

```typescript
interface MetaAccount {
    accountId: string;
}
```

`accountId`

Type: string
Account ID of the user in your system. Currently this is a required field for all data to be pushed in.

-----

[Next Step: Importing data into user's digi.me library >](./import-data.md)

[Back to Index](./README.md)
