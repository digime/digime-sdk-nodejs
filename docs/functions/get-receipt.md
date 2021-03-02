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

# Push and Share Receipts

The SDK provides a handy utility function that returns a deeplink to the native digi.me application to display share or push receipts related to your application and contract.

#### Arguments
> [GetReceiptOptions](#GetReceiptOptions)

#### Returns
> string: Deeplink to show receipt inside digi.me.

#### Example
```typescript
import { getReceipt } from "@digime/digime-js-sdk";

const result = await getReceipt({
  applicationId: "test-application-id",
  contractId: "test-contract-id"
});

// => result = digime://receipt?contractId=test-contract-id&appId=test-application-id`
```

## GetReceiptOptions
```typescript
interface GetReceiptOptions {
    applicationId: string;
    contractId: string;
}
```
| Parameter | Required | Description | Type |
|-|-|-|-|
| `applicationId` | Yes | The ID of your application as provided from digi.me. | string |
| `contractId` | Yes | The ID of your contract as provided from digi.me. | string |

-----

[Back to Index](../README.md)
