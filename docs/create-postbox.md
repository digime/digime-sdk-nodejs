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

# Creating a Postbox

In order to push data to a user, the user needs to have a postbox. A postbox is a temporary secure storage that only you and your user can access. To create a postbox, the user needs to have the native digi.me application installed. Your user's digi.me will periodically import any data stored in their postboxes. You should create a new postbox for each [session](#establishing-a-session).

Use the `getCreatePostboxUrl` function to get a Url which can be used to trigger the native digi.me client to create a postbox. Once the user has given consent, the digi.me client will trigger the callbackUrl with the `postboxId` and `publicKey` in the query parameter.

```typescript
const getCreatePostboxUrl = (
    appId: string,
    session: Session,
    callbackUrl: string
): string;
```

> Returns a link which when triggered will start a postbox creation flow in the native digi.me client

`appId`: string

Your application ID. You can request this from digi.me.

`session`: Session

Session received when we first established a session

`callbackUrl`: string

The link which the digi.me application will trigger once the postbox is created. The callback will look something like this:
*<CALLBACK_Url>?publicKey=<PUBLIC_KEY>&postboxId=<POSTBOX_ID>&result=SUCCESS*

#### Exceptions
[TypeValidationError](./handling-errors.md)

-----

[Next Step: Push data into Postbox >](./push-data.md)

[Back to Index](./README.md)
