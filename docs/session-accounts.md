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

# Requesting User Accounts

To request user accounts, you'll need to have created a session and asked for the user's consent. Please see the appropriate sections on how to do these.

## getSessionAccounts
To see a list of accounts that the user has in their library, we can also call `getSessionAccounts` to request this information. This will return all accounts that the user has in their digi.me, which will contain service names, account identifiers and logos (of applicable).

To fetch account data
```typescript
const getSessionAccounts = async (
    sessionKey: string,
    privateKey: NodeRSA.Key,
): Promise<Accounts>;
```
`sessionKey`: string

Session ID received when we first established as session

`privateKey`: NodeRSA.Key

Private key in PKCS1 format which can be used to decrypt user's data. This is related to the contract, so you would need this when you receive the contract Id from digi.me.


-----

[Back to Index](./README.md)
