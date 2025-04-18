---
title: Contract and Application ID
---

# Contract and Application ID

To get your Application ID, you can fill out the [registration form here](https://worlddataexchange.com/register).

Contracts represent the data you are requesting from your users, as well as the specifics around the terms of use. Each contract has a contract ID and a private key, which work together to request, download, and decrypt the personal data shared with your app.

For demo purposes, we provide example contracts with example keys in our [example application](https://github.com/worlddataexchange/digime-sdk-nodejs-example). In order to release your app to production, you will need personalised contracts that are tied to your application ID and have your branding and contact information as well as your legal terms embedded. When you are ready to go to production or interact with real users, visit our [launching your app](https://worlddataexchange.com/contact) page to request production contracts.

There are three types of contracts available:

## Read Contracts

These are contracts that request data from the user.

Some example read contracts may be:

- A contract requesting all social media posts from a user.
- A contract requesting all medical data in the past six months.

## Write Contracts

These are contracts that allow you to push data in to a user's library.

## Read Raw Contracts

If you have written something to the user, then you can use a read raw contract to request this data back out.

## Contract Details

Currently, we provide the option to get contract details. If you want to get your contract details you need to call the following method:

```typescript
// Initialize the SDK
import {init} from "@digime/digime-sdk-nodejs";

const sdk = init({ applicationId: <you-application-id> });

// contractDetails - The same one used in getAuthorizeUrl() where you have contract ID and private key.
const report = await sdk.getContractDetails({
    contractDetails,
});

//.
```

Please click {@link Types.GetContractDetailsResponse | here} to check the response.
