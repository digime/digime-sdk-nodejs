# Digi.me SDK for javascript
---
The Digi.me SDK for Javascript/Typescript is a Node library that allows seamless authentication with Consent Access service, making content requests and core decryption services. For details on the API and general CA architecture - visit [Dev Support Docs](https://developers.digi.me/consent-access.html)

## Prerequisite 
In order to run the complete Consent Access process, the Digi.me SDK for javascript required the Digi.me app being installed on either an iOS or Android device to enable user authorization of requests. For detailed explanation of the Consent Acess architecture - visit [Dev Support Docs](https://developers.digi.me/consent-access.html)

## Requirements
- Node 8 or above

## Table of Contents

  * [Installation](#installation)
  * [SDK usage](#sdk-usage)

## Installation
Details to come.

## SDK Usage
### Obtaining your Contract ID/App ID/Private Key

Before accessing the public APIs, a valid Contract ID needs to be registered for an App ID.
The Contract ID uniquely identifies a contract with the user that spells out what type of data you want, what you will and won't do with it, how long you will retain the data and whether you will implement the right to be forgotten.

Additionally it also specifies how the data is encrypted in transit.

A private key is needed to decrypt data that is passed back. Digi.me can provide you with a private ID.

To register a Consent Access contract check out [Digi.me Dev Support](https://developers.digi.me). There you can request a Contract ID and App ID to which it is bound.

### Configuring digi.me environment
When initialising the SDK, you have the option to specify an digi.me environment to use. By default it will use the production environment of digi.me. Unless specifically instructed, it is best to use this environment as it will be the most stable.
To specify an environment you can initialise the SDK like the following:
```javascript
    createSDK({host: "[PATH_TO_ENVIRONMENT]"});
```

### Establishing a session
To start fetching data into your application, you will need to authorise a session.
The authorisation flow is separated into two phases:

Initialise a session with Digi.me API which returns a session object.
    ```javascript
    establishSession = async (appId: string, contractId: string, options: DigiMeSDKConfiguration): Promise<Session>;
    ```

### Getting User Consent
In digi.me we provide two different ways to prompt user for consent
1. Existing users who already have the digi.me application installed - Use the `getAppURL` method to get a URL which can be used to trigger the digi.me client to open on their Android or iOS devices. The callbackURL you pass in will be the URL the digi.me client will call once the user has accepted the data request. Given the session id, the client will know the details of the contract and ask for the user's permission on only the data the contract needs.
    ```javascript
    getAppURL = (appId: string, session: Session, callbackURL: string);
    ```

2. Guest consent - This is a demo feature which allows the user to consent and onboard to digi.me using the browser. To trigger this onboard mode, you can call the `getWebURL` method to get a URL which when opened will ask user for consent.
    ```javascript
    getWebURL = (session: Session, callbackURL: string, options: DigiMeSDKConfiguration);
    ```

Regardless of which mode above you've trigger, the callbackURL will be triggered once the user has authorised the consent. The callbackURL will be triggered with a new param `result` where the value will either be `DATA_READY` or `CANCELLED` if the user decided to deny the request.

### Fetching Data
Upon successful authorisation you can now request user's files. To fetch all available data for your contract you can call getDataForSession to start your data fetch. You'll need to provide us with a private key with which we will try and decrypt user data. In addition you can pass a fileCallback which will be triggered whenever a user data file is processed and returned to the user.
```javascript
getDataForSession = async (
    sessionKey: string,
    privateKey: NodeRSA.Key,
    fileCallback: FileCallback,
    options: DigiMeSDKConfiguration
): Promise<any>;
```
