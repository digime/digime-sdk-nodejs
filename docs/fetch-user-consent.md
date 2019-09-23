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

# Getting User Consent

Before we fetch data from the user, we will need to ask our users for their consent.

In digi.me we provide two different ways to prompt user for consent: For users who already have a digi.me and for new users.

## For Existing Users
This method targets existing users who already have the digi.me application installed on their desktop or mobile devices.
To trigger the consent screen, we can use the `getAuthorizeUrl` method to get a Url which can be used to trigger the digi.me client to open on their desktop, Android or iOS devices. 

```typescript
const getAuthorizeUrl = (
    appId: string,
    session: Session,
    callbackUrl: string
): string;
```
> Returns a string

`appId`: string

The ID of your application

`session`: Session

The session object which you received when you first established a session with digi.me

`callbackUrl`: string

The callbackUrl you pass in will be the URL the digi.me client will call once the user has given consent. Given the session id, the client will know the details of the contract and ask for the user's permission on only the data the contract needs. When the callbackUrl is triggered, a new parameter `result` will be appended to the URL with the result of the consent. The value will either be `SUCCESS`, `ERROR` or `CANCEL`. 

For example, if the callback URL passed in is `https://www.yourapplication.com/results?sessionId=<sessionId>`, after a successful consent, this page will be loaded in the client's browser: `https://www.yourapplication.com/results?sessionId=<sessionId>&result=SUCCESS`


## For New Users - GUEST CONSENT
This is a demo feature which allows the user to connect sources and then give consent using the browser. To trigger guest consent, you can call the `getGuestAuthorizeUrl` method to get a Url which when opened will trigger the guest consent flow.

```typescript
const getGuestAuthorizeUrl = (
    session: Session,
    callbackUrl: string
): string;
```
> Returns a string

`session`: Session

The session object which you received when you first established a session with digi.me

`callbackUrl`: string

The callbackUrl you pass in will be the URL the digi.me client will call once the user has given consent. Given the session id, the client will know the details of the contract and ask for the user's permission on only the data the contract needs. When the callbackUrl is triggered, a new parameter `result` will be appended to the URL with the result of the consent. The value will either be `SUCCESS`, `ERROR` or `CANCEL`. 

Once the user has consented to your request, we can now try to fetch user data using your session ID.

-----

[Back to Index](./README.md)
